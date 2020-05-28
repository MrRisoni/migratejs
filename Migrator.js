const moment = require('moment');
const os = require('os');
const yaml = require('js-yaml');
const fs = require('fs');
const natural = require('natural');


var Sequelize = require('sequelize');

module.exports = class Migrator {

    constructor(ymlConfig) {
        this.dbg = true;
        this.connection = null;
        this.MigrationModel = null;
        this.yamlConfigFile = ymlConfig;
        this.supportedColTypes = ['tinyint', 'int', 'bigint', 'mediumint', 'varchar', 'text', 'float', 'decimal', 'date', 'datetime']
    }

    setUpDB(dbOption) {

        try {
            const projectSettings = yaml.safeLoad(fs.readFileSync(this.yamlConfigFile, 'utf8'));
            const settings = projectSettings['database'];
            console.log('connecting to ' + dbOption);
            console.log(settings[dbOption])

            this.connection = new Sequelize(settings[dbOption].db, settings[dbOption].user, settings[dbOption].pass, {
                host: settings[dbOption].host,
                dialect: 'mysql',
                define: {
                    charset: 'utf8',
                    collate: 'utf8_general_ci',
                    timestamps: true
                },
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                logging: false
            });


            this.connection
                .authenticate()
                .then(() => {
                    console.log('Connection has been established successfully.');
                })
                .catch(err => {
                    console.error('Unable to connect to the database:', err);
                });


            this.MigrationModel = this.connection.define('migrations', {
                    id: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: 'id',
                        autoIncrement: true,
                        primaryKey: true,
                    },
                    fileName: {
                        type: Sequelize.CHAR,
                        field: 'file_name'
                    },
                    processes: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: 'processed'
                    }
                },
                {
                    timestamps: false,
                    freezeTableName: true
                }
            );


        } catch (e) {
            console.log(e);
        }
    }

    newMigration(args) {
        console.log('migration args')
        console.log(args)
        var nounInflector = new natural.NounInflector();

        let model_name = nounInflector.pluralize(args[0]).toLowerCase();


        const stamp = moment().format('YYYYMMDD_hhmmss');
        const self = this;

        const migrationName = 'migration' + stamp + '_' + model_name;

        let prfx = '';
        let colstart = 1;
        if (args[1].indexOf('--prefix') > -1) {
            colstart = 2;
            console.log(args[1]);
            var tmp = args[1].split('=');
            prfx = tmp[1]
        }


        let yamlData = {
            create_table: 1, prefix: prfx,
            table_name: model_name, id: {type: 'bigint', unsigned: true},
            created_at: true, updated_at: true, columns: []
        };

        for (var col = colstart; col < args.length; col++) {
            var col_data = args[col].split(':');
            var col_type = col_data[1].toUpperCase();
            if (this.supportedColTypes.indexOf(col_data[1]) < 0) {
                // oops type not  supported
            }

            yamlData.columns.push({title: col_data[0], type: col_type})
        }
        console.log(yamlData);

        let yamlStr = yaml.safeDump(yamlData);

        this.promiseFSWrite({filename: migrationName, contents: yamlStr}).then(resWrite => {
            console.log(resWrite);
            self.insertMigration(migrationName).then(resDB => {
                process.exit();
            }).catch(errDB => console.log(errDB));

        }).catch(errWrite => console.log(errWrite));

    }

    promiseFSWrite(args) {
        return new Promise((resolve, reject) => {

            fs.writeFile("migrations/" + args.filename + ".yaml", args.contents, err => {
                if (err) {
                    reject('Error writing file ' + err);
                }
                resolve('File written!');
            });
        });
    }

    insertMigration(fileName) {
        const query = " INSERT INTO `migrations` (`file_name`,`created_at`) VALUES ('" + fileName + "',NOW())";
        return this.connection.query(query);

    }

    update(migrationFile) {
        this.connection.query("UPDATE migrations SET processed = 1, " +
            " updated_at = NOW() WHERE file_name = '" + migrationFile + "' ").spread((results, metadata) => {
        });
    }

    run(query) {
        console.log(query);
        this.connection.query(query).then(myTableRows => {
        });

    }

    execute(query) {
        return new Promise((resolve, reject) => {
            this.connection.query(query, {type: Sequelize.QueryTypes.RAW}).then(rows => {
                console.log('Exe Migrator_execute');
                resolve({proceed: true});

            }).catch(err => {
                console.log('Err Migrator_execute ' + err);

                reject({proceed: false});
            });
        });
    }


    runGenericQuery(sql) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, {type: Sequelize.QueryTypes.RAW}).then(rows => {
                resolve({proceed: true});

            }).catch(err => {
                console.log(err);
                reject({proceed: false});
            });
        });
    }


    executeMigrations() {
        const self = this;

        self.MigrationModel.findAll({
            where: {
                processed: 0
            },
            order: [
                ['created_at', 'ASC']
            ]
        }).then(results => {
            if (results.length > 0) {
                results.forEach(res => {


                    let fileContents = fs.readFileSync(`./migrations/${res.fileName}.yaml`, 'utf8');
                    let data = yaml.safeLoad(fileContents);
                    let prefix = data.prefix + '_';

                    console.log(data);
                    let columnsSQL = [prefix + 'id BIGINT'];
                    data.columns.forEach((item, i) => {
                        columnsSQL.push(this.makeColumnSQL(item, prefix));
                    });

                    if (data.created_at) {
                        columnsSQL.push(prefix + "created_at DATETIME")
                    }
                    if (data.updated_at) {
                        columnsSQL.push(prefix + "updated_at DATETIME")
                    }


                    let createSQL = ' CREATE TABLE ' + data.table_name + ' ( ' + columnsSQL.join(',') + ')';

                    console.log(createSQL);
                    console.log(res.id + " " + res.fileName)

                    this.connection.query(createSQL).then(
                        this.connection.query("UPDATE migrations SET processed=1 WHERE id = '" + res.id + "' ")
                    );

                    /*  //   const migration20180422_083815authors = require('./migrations/migration20180422_083815authors');
                      const migrationClass = require(`./migrations/${res.fileName}.js`);

                      let mg = new migrationClass(self.migr);
                      console.log('Executing migration ... ' + res.fileName);

                      mg.schemaUp().then(result => {
                          console.log('Migration result ' + result);
                          self.migr.update(res.fileName);
                      });*/


                });
            } else {
                console.log('Nothing to migrate');
            }
        });

    }


    makeColumnSQL(col, prefix) {
        let sql = "`" + prefix + col.title + "`"

        switch (col.type) {
            case 'STRING':
                sql += " VARCHAR(255) "; //" COLLATE " + col.options[0]['collation']
                break;
            case 'TEXT':
                sql += " TEXT "; //" COLLATE " + col.options[0]['collation']
                break;
            case 'DECIMAL':
                sql += " DECIMAL(" + col.options[0]['precision'] + "," + col.options[0]['scale'] + ")"
                if (col.options[0]['unsigned']) {
                    sql += ' UNSIGNED '
                }
                if (col.options[0]['not_null']) {
                    sql += ' NOT NULL '
                }
                sql += " DEFAULT '0' "

                break;
            default:
                sql = '';
        }

        return sql
    }


    newReference(ref) {
        console.log(ref);

        // AddReferenceXToY
        ref = ref.replace('AddReference', '')
        console.log(ref);
        const data = ref.split('To')
        let from_table = data[0];
        let to_table = data[1];
        let ref_col = '';


        var natural = require('natural');
        var nounInflector = new natural.NounInflector();
        console.log(nounInflector.pluralize('radius'));

        console.log(from_table + ' ' + to_table + ref_col);
        // get primary key

        this.connection.query("SHOW KEYS FROM '" + to_table + "' WHERE Key_name = 'PRIMARY'").then(rsl => {

            const pkey = rsl.Column_name;

        });


    }

    rollback() {
        // only for create table now
        console.log('Rooback qery');
        this.MigrationModel.findAll({
            where: {
                processed: 1
            },
            limit: 1,
            order: [
                ['created_at', 'DESC']
            ]
        }).then(foo => {
            console.log(foo[0].fileName);
            const rollingBackName = foo[0].fileName;
            const rollingBackId = foo[0].id;


            let fileContents = fs.readFileSync(`./migrations/${rollingBackName}.yaml`, 'utf8');
            let data = yaml.safeLoad(fileContents);
            if (data.create_table ==1) {
                const dropSql = "DROP TABLE " + data.table_name;
                this.connection.query(dropSql).then(res => {
                    this.connection.query("DELETE FROM  migrations WHERE id = '"  + rollingBackId + "' ").then(res => {
                        console.log('OK!');

                    }).catch(err1 => {
                        console.log(err1)
                    });
                }).catch(err2 => {
                    console.log(err2)
                })
            }
        })

    }

}

