const moment = require('moment');
const os = require('os');
const yaml = require('js-yaml');
const fs = require('fs');


var Sequelize = require('sequelize');

module.exports = class Migrator {

    constructor(ymlConfig) {
        this.dbg = true;
        this.connection = null;
        this.MigrationModel = null;
        this.SeederModel = null;
        this.yamlConfigFile = ymlConfig;
    }

    setUpDB(dbOption){

        try {
            const projectSettings = yaml.safeLoad(fs.readFileSync(this.yamlConfigFile, 'utf8'));
            const settings =projectSettings['database'];
            console.log('connecting to ' + dbOption);
            console.log(settings[dbOption])

            this.connection = new Sequelize(settings[dbOption].db, settings[dbOption].user, settings[dbOption].pass, {
                host: settings[dbOption].host,
                dialect: 'mysql',
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

    newMigration(args)
    {
        console.log('migration args')
        console.log(args)
        const model_name = args[0];
        const stamp = moment().format('YYYYMMDD_hhmmss');
        const self = this;

        const migrationName = 'migration' + stamp + '_' +model_name;

        let yamlData = {create_table:1,
        table_name:model_name,id:{type:'bigint',unsigned:true},
        created_at:true,updated_at:true,columns:[]};

        for (var col = 1; col < args.length;col++) {
            var col_data = args[col].split(':');
            yamlData.columns.push({title:col_data[0],type:'VARCHAR'})
        }


        let yamlStr = yaml.safeDump(yamlData);

        this.promiseFSWrite({filename: migrationName, contents: yamlStr}).then(resWrite => {
            console.log(resWrite);
            self.insertMigration(migrationName).then(resDB => {
                process.exit();
            }).catch(errDB => console.log(errDB));

        }).catch(errWrite => console.log(errWrite));

    }

    promiseFSWrite(args)
    {
        return new Promise( (resolve, reject) => {

            fs.writeFile("migrations/" + args.filename + ".yaml", args.contents, err => {
                if (err) {
                    reject('Error writing file ' + err);
                }
                resolve('File written!');
            });
        });
    }

    insertMigration(fileName) {
        const query = " INSERT INTO `migrations` (`file_name`) VALUES ('" + fileName + "')";
      //  this.connection.query(query).then(myTableRows => {});
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
        return new Promise((resolve, reject ) => {
            this.connection.query(query, {type: Sequelize.QueryTypes.RAW}).then(rows => {
                console.log('Exe Migrator_execute');
                resolve({proceed: true});

            }).catch(err => {
                console.log('Err Migrator_execute ' + err);

                reject({proceed: false});
            });
        });
    }


    runGenericQuery(sql){
        return new Promise((resolve, reject ) => {
            this.connection.query(sql, {type: Sequelize.QueryTypes.RAW}).then(rows => {
                resolve({proceed: true});

            }).catch(err => {
                console.log(err);
                reject({proceed: false});
            });
        });
    }


}
