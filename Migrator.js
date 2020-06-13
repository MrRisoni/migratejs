const moment = require("moment");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const _ = require("lodash");
const migration_helpers = require("./migration_helpers");
const dialects = require("./sql_dialects");

module.exports = class Migrator {
    constructor(ymlConfig) {
        this.dbg = true;
        this.connection = null;
        this.MigrationModel = null;
        this.yamlConfigFile = ymlConfig;
        this.dialect = "";
        this.supportedColTypes = [
            "tinyint",
            "int",
            "bigint",
            "mediumint",
            "varchar",
            "text",
            "float",
            "decimal",
            "date",
            "datetime"
        ];
    }

    init() {
        const createMigrationsTableSQL =
            "  CREATE TABLE `migrations` (   \
                                        `id` bigint UNSIGNED NOT NULL,  \
                                        `file_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, \
                                        `processed` tinyint UNSIGNED NOT NULL DEFAULT 0, \
                                        `created_at` datetime DEFAULT CURRENT_TIMESTAMP, \
                                        `updated_at` datetime DEFAULT CURRENT_TIMESTAMP \
                                      ) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

        const uniqueIdxSQL =
            "  ALTER TABLE `migrations`  \
                                        MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \
                                        ADD PRIMARY KEY (`id`),  \
                                        ADD UNIQUE KEY `file_name` (`file_name`); ";

        this.connection.query(createMigrationsTableSQL).then(res => {
            this.connection.query(uniqueIdxSQL);
        });
    }

    setUpDB(dbOption) {
        try {
            const projectSettings = yaml.safeLoad(
                fs.readFileSync(this.yamlConfigFile, "utf8")
            );
            const settings = projectSettings["database"];
            this.dialect = projectSettings["dialect"];
            console.log("settings");
            console.log(this.dialect);
            console.log("connecting to " + dbOption);
            console.log(settings[dbOption]);
            this.migrations_path =
                this.dialect === "postgres" ? "postgres_migrations" : "migrations";

            this.connection = new Sequelize(
                settings[dbOption].db,
                settings[dbOption].user,
                settings[dbOption].pass,
                {
                    host: settings[dbOption].host,
                    dialect: this.dialect,
                    dialectOptions: {
                        ssl: false
                    },
                    define: {
                        charset: "utf8",
                        collate: "utf8_general_ci",
                        timestamps: true
                    },
                    pool: {
                        max: 5,
                        min: 0,
                        acquire: 30000,
                        idle: 10000
                    },
                    logging: false
                }
            );

            this.connection
                .authenticate()
                .then(() => {
                    console.log("Connection has been established successfully.");
                })
                .catch(err => {
                    console.error("Unable to connect to the database:", err);
                });

            this.MigrationModel = this.connection.define(
                "migrations",
                {
                    id: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: "id",
                        autoIncrement: true,
                        primaryKey: true
                    },
                    fileName: {
                        type: Sequelize.CHAR,
                        field: "file_name"
                    },
                    processed: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: "processed"
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

    removeIndex(data) {
        console.log("finc removeIndex");
        console.log(data);
        const migrName = this.getNewMigrationFileName(data[0]);
        let to_table = data[0].replace("RemoveIndexFrom_", "");

        let yamlData = {
            drop_index: 1,
            name: migrName,
            table_name: to_table,
            index_name: data[1]
        };

        this.registerMigration(migrName, yaml.safeDump(yamlData));
    }

    newTable(args) {
        let model_name = args[0].replace("CreateTable_", "");

        const stamp = this.getNewMigrationFileName(args[0]);
        const self = this;

        const migrationName = "migration" + stamp + "_" + args[0];

        let prfx = "";
        let colstart = 1;
        if (args[1].indexOf("--prefix") > -1) {
            colstart = 2;
            console.log(args[1]);
            let tmp = args[1].split("=");
            prfx = tmp[1];
        }

        let yamlData = {
            create_table: 1,
            prefix: prfx,
            name: migrationName,
            table_name: model_name,
            comment: "",
            charset: "utf8",
            engine: "InnoDB",
            id: {type: "bigint", unsigned: true},
            created_at: true,
            updated_at: true,
            columns: []
        };

        for (let col = colstart; col < args.length; col++) {
            let col_data = args[col].split(":");
            let col_type = col_data[1].toUpperCase();
            //  if (this.supportedColTypes.indexOf(col_data[1]) < 0) {
            // oops type not  supported
            //   }
            yamlData.columns.push({title: col_data[0], type: col_type});
        }
        console.log(yamlData);

        let yamlStr = yaml.safeDump(yamlData);
        this.registerMigration(migrationName, yamlStr);

    }

    newIndex(ref) {
        // AddReferenceXTo
        const self = this;
        const migrationName = this.getNewMigrationFileName(ref)

        let to_table = ref.replace("AddIndexTo_", "");
        //  console.log(to_table);
        const yamlData = {
            create_index: 1,
            table: to_table,
            name: "",
            unique: false,
            columns: [{title: "ColA"}]
        };
        let yamlStr = yaml.safeDump(yamlData);

        this.registerMigration(migrationName, yamlStr);
    }


    addIndexMigration(data, res) {
        const selbst = this;

        console.log("creating index");
        let cols = data.columns.map(col => {
            return col.title;
        });
        let to_table = data.table;

        let indexSQL = "CREATE ";
        if (data.unique) {
            indexSQL += " UNIQUE ";
        }
        indexSQL += " INDEX " + data.name + " ON " + to_table;
        indexSQL += " ( " + cols.join(",") + ")";
        console.log(indexSQL);
        return selbst.connection.query(indexSQL);
    }

    changeColumnMigration(data, res) {
        const selbst = this;
        selbst.getPrefixOrigin(data.table_name).then(dt => {
            let prfx = dt;
            console.log("prfx " + prfx);
            // get original type
            // write rollback backup migration file
            selbst
                .getColType(data.table_name, prfx + data.columns[0].title)
                .then(oldTypeRes => {
                    console.log("old type");
                    console.log(oldTypeRes[0]);

                    const ymlOldType = {
                        change_column_type: 1,
                        name: "rlbk_" + res.fileName,
                        table_name: data.table_name,
                        title: prfx + data.columns[0].title,
                        was: oldTypeRes[0].Type
                    };

                    selbst
                        .writeRollBackMigrationFile({
                            filename: "rlbk_" + res.fileName,
                            contents: yaml.safeDump(ymlOldType)
                        })
                        .then(writeRblk => {
                            const modifySQL =
                                "ALTER TABLE " +
                                data.table_name +
                                " MODIFY COLUMN  " +
                                prfx +
                                data.columns[0].title +
                                " " +
                                data.columns[0].to.toUpperCase();
                            console.log(modifySQL);
                            return selbst.this.connection.query(modifySQL);
                        });
                });
        });
    }


    newForeignKey(args) {
        let rest = args.replace("AddForeignKeyTo", "");
        const data = rest.split("References");
        const from_tbl = data[0];
        const to_tbl = data[1];

        const migrName = this.getNewMigrationFileName(args);

        let yamlData = {
            create_fkey: 1,
            name: migrName,
            table: from_tbl,
            referenceTable: to_tbl,
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        };

        this.getPrefixOriginAndFkeyData(from_tbl, to_tbl).then(promiseRes => {
            const fkeyData = promiseRes[1];
            yamlData.fkey_column_name =
                promiseRes[0] + to_tbl.toLocaleLowerCase() + "_id";
            yamlData.fkey_type = fkeyData.type;
            yamlData.referenceCol = fkeyData.name;

            this.registerMigration(migrName, yaml.safeDump(yamlData));
        });
    }

    newReference(ref) {
        //  console.log(ref);

        // AddReferenceXToY
        ref = ref.replace("AddReference", "");
        // console.log(ref);
        const data = ref.split("To");
        let from_table = data[0];
        let to_table = data[1];
        let ref_col = "";

        let natural = require("natural");
        let nounInflector = new natural.NounInflector();
        //   console.log(nounInflector.pluralize("radius"));

        //   console.log(from_table + " " + to_table + ref_col);
        // get primary key

        this.connection
            .query("SHOW KEYS FROM '" + to_table + "' WHERE Key_name = 'PRIMARY'")
            .then(rsl => {
                const pkey = rsl.Column_name;
            });
    }


    writeMigrationFile(args) {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                this.migrations_path + "/" + args.filename + ".yaml",
                args.contents,
                err => {
                    if (err) {
                        reject("Error writing file " + err);
                    }
                    resolve("File written!");
                }
            );
        });
    }

    writeRollBackMigrationFile(args) {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                "rollbacks/" + args.filename + ".yaml",
                args.contents,
                err => {
                    if (err) {
                        reject("Error writing file " + err);
                    }
                    resolve("File written!");
                }
            );
        });
    }

    insertMigration(fileName) {
        return this.MigrationModel.build({
            fileName: fileName,
            processed: 0
        }).save();
    }

    update(migrationFile) {
        console.log("Registering " + migrationFile + " as complete");
        return this.connection
            .query(
                "UPDATE migrations SET processed = 1, updated_at = NOW() " +
                " WHERE file_name = '" +
                migrationFile +
                "' "
            )
            .spread((results, metadata) => {
            });
    }
  /*
      run(query) {
          console.log(query);
          this.connection.query(query).then(myTableRows => {
          });
      }

      execute(query) {
          return new Promise((resolve, reject) => {
              this.connection
                  .query(query, {type: Sequelize.QueryTypes.RAW})
                  .then(rows => {
                      console.log("Exe Migrator_execute");
                      resolve({proceed: true});
                  })
                  .catch(err => {
                      console.log("Err Migrator_execute " + err);

                      reject({proceed: false});
                  });
          });
      } */

    dropTableMigration(data, res) {
        console.log("Dropping table");
        const dropSQL = "DROP  TABLE " + data.tables[0];
        console.log(dropSQL);

        return this.connection.query(dropSQL);
    }

    getColumnsListFromTable(tblName) {
        return this.connection.query("SHOW COLUMNS FROM " + to_table);
    }

    runTask(spec) {
        console.log("TYPE IS " + spec["type"]);
        switch (spec["type"]) {
            case "create_table":
                return migration_helpers.createTableMigration(spec);
            case "add_columns":
                return migration_helpers.addColumnMigration(spec);
            case "rename_columns":
                return migration_helpers.renameColumnMigration(spec);
            case "remove_columns":
                return migration_helpers.removeColumnMigration(spec);
        }
    }

    async migrationReduce(promiseArr) {
        const self = this;

        const starterPromise = Promise.resolve(null);
        const log = result => console.log(result);

        await promiseArr.reduce(
            (p, spec) => p.then(() => self.runTask(spec).then(log)),
            starterPromise
        );
    }

    executeMigrations() {
        const self = this;
        let migrFuncArgs = {};
        console.log("executeMigrations");

        this.get_pending_res_migrs().then(res => {
            let promiseArr = res.map(migrRow => {
                //console.log(migrRow.fileName);
                let fileContents = fs.readFileSync(
                    `./${this.migrations_path}/${migrRow.fileName}.yaml`,
                    "utf8"
                );
                let data = yaml.safeLoad(fileContents);
                migrFuncArgs = {
                    data: data,
                    dialect: self.dialect,
                    conn: self.connection,
                    migrName: migrRow.fileName
                };

                if (data.create_table === 1) {
                    migrFuncArgs["type"] = "create_table";
                } else if (data.add_columns) {
                    migrFuncArgs["type"] = "add_columns";
                } else if (data.rename_columns === 1) {
                    migrFuncArgs["type"] = "rename_columns";
                } else if (data.remove_columns === 1) {
                    migrFuncArgs["type"] = "remove_columns";
                }

                return migrFuncArgs; //migrationFunction;
            });
            self.migrationReduce(promiseArr).then(migrationResult => {
                console.log('migrationResult');
              console.log(migrationResult);
            });
        });
    }

    get_pending_res_migrs() {
        const self = this;

        return self.MigrationModel.findAll({
            where: {
                processed: 0
            },
            order: [["id", "ASC"]]
        });
    }

    getNewMigrationFileName(ref) {
        const stamp = moment().format("YYYYMMDD_hhmmss");
        return "migration" + stamp + "_" + ref;
    }

    registerMigration(migrationName, yamlStr) {
        const self = this;
        this.writeMigrationFile({filename: migrationName, contents: yamlStr})
            .then(resWrite => {
                console.log(resWrite);
                self
                    .insertMigration(migrationName)
                    .then(resDB => {
                        process.exit();
                    })
                    .catch(errDB => console.log(errDB));
            })
            .catch(errWrite => console.log(errWrite));
    }

    getPrefixOriginAndFkeyData(from_table, to_table) {
        return Promise.all([
            this.getPrefixOrigin(from_table),
            this.getFkeyTypeAndName(to_table)
        ]);
    }

    getColType(from_tbl, col_name) {
        return this.connection.query(
            "SHOW COLUMNS FROM " + from_tbl + " WHERE Field = '" + col_name + "' ",
            {type: Sequelize.QueryTypes.SELECT}
        );
    }

    getPrefixOrigin(from_tbl) {
        const selbst = this;
        return new Promise((resolve, reject) => {
            selbst.connection
                .query("SHOW COLUMNS FROM " + from_tbl, {
                    type: Sequelize.QueryTypes.SELECT
                })
                .then(rsl => {
                    // get primary key type and name
                    // console.log(rsl)
                    const pKeyCol = rsl.filter(col => {
                        return col.Key === "PRI";
                    })[0];
                    const fieldName = pKeyCol.Field;
                    const fieldNameData = fieldName.split("_");
                    let prfx = "";
                    if (fieldNameData.length > 1) {
                        prfx = fieldNameData[0] + "_";
                    }
                    resolve(prfx);
                })
                .catch(err => {
                    console.log("ERRR fkey  " + err);
                    reject();
                });
        });
    }

    getFkeyTypeAndName(to_tbl) {
        const selbst = this;
        return new Promise((resolve, reject) => {
            selbst.connection
                .query("SHOW COLUMNS FROM " + to_tbl, {
                    type: Sequelize.QueryTypes.SELECT
                })
                .then(rsl => {
                    // get primary key type and name
                    // console.log(rsl)
                    const pKeyCol = rsl.filter(col => {
                        return col.Key === "PRI";
                    })[0];
                    resolve({name: pKeyCol.Field, type: pKeyCol.Type});
                })
                .catch(err => {
                    console.log("ERRR fkey  " + err);
                    reject();
                });
        });
    }

    rollback() {
        // only for create table now
        console.log("Rollback qery");
        const self = this;
        this.MigrationModel.findAll({
            where: {
                processed: 1
            },
            limit: 1,
            order: [["created_at", "DESC"]]
        }).then(foo => {
            //console.log(foo[0].fileName);
            const rollingBackName = foo[0].fileName;
            const rollingBackId = foo[0].id;

            let fileContents = fs.readFileSync(
                `./${this.migrations_path}/${rollingBackName}.yaml`,
                "utf8"
            );
            let data = yaml.safeLoad(fileContents);
            if (data.add_columns === 1) {
                let prfx = "";
                this.getPrefixOrigin(data.table_name).then(dt => {
                    prfx = dt;
                    //  console.log("prfx " + prfx);
                    //  console.log();
                    const dropSQL =
                        "ALTER TABLE " +
                        data.table_name +
                        " DROP COLUMN  " +
                        prfx +
                        data.columns[0].title;
                    this.rollBackNotifyDB(dropSQL, rollingBackId);
                });
            } else if (data.change_column_type === 1) {
                // console.log("Reading Rollback Migration");

                let fileContents = fs.readFileSync(
                    `./rollbacks/rlbk_${rollingBackName}.yaml`,
                    "utf8"
                );
                let data = yaml.safeLoad(fileContents);
                // console.log(data);

                const modifySQL =
                    "ALTER TABLE " +
                    data.table_name +
                    " MODIFY COLUMN  " +
                    data.title +
                    " " +
                    data.was.toUpperCase();
                //   console.log(modifySQL);
                this.connection.query(modifySQL).then(success => {
                    self.deleteMigrationFromDB(rollingBackId);
                });
            } else if (data.create_table === 1) {
                const dropSql = "DROP TABLE " + data.table_name;
                this.connection
                    .query(dropSql)
                    .then(res => {
                        this.deleteMigrationFromDB(rollingBackId);
                    })
                    .catch(err2 => {
                        console.log(err2);
                    });
            } else if (data.create_index === 1) {
                const dropSql =
                    " DROP INDEX " + data.name + " ON " + this.nlpTable(data.table);
                this.deleteMigration(dropSql, rollingBackId);
            }
        });
    }

    deleteMigrationFromDB(rollingBackId) {
        this.connection
            .query("DELETE FROM  migrations WHERE id = '" + rollingBackId + "' ")
            .then(res => {
                console.log("OK!");
            })
            .catch(err1 => {
                console.log(err1);
            });
    }

    rollBackNotifyDB(dropSql, rollingBackId) {
        const selbst = this;
        this.connection
            .query(dropSql)
            .then(res => {
                selbst.deleteMigrationFromDB(rollingBackId);
            })
            .catch(err2 => {
                console.log(err2);
            });
    }

    deleteMigration(dropSql, rollingBackId) {
        return new Promise((resolve, reject) => {
            this.connection
                .query(dropSql)
                .then(res1 => {
                    this.connection
                        .query(
                            "DELETE FROM  migrations WHERE id = '" + rollingBackId + "' "
                        )
                        .then(res2 => {
                            console.log("OK!");
                            resolve();
                        })
                        .catch(err1 => {
                            console.log(err1);
                            reject();
                        });
                })
                .catch(err2 => {
                    console.log(err2);
                    reject();
                });
        });
    }

    getMigrationFiles() {
        const self = this;

        return new Promise((resolve, reject) => {
            const directoryPath = path.join(__dirname, self.migrations_path);
            fs.readdir(directoryPath, function (err, files) {
                resolve(
                    files
                        .map(fil => {
                            //  console.log(fil);
                            const data = fil.split("_");

                            return {id: data[0], name: fil.replace(".yaml", "")};
                        })
                        .sort(function (a, b) {
                            // sort in order of creation
                            if (a.id < b.id) return -1;
                            if (a.id > b.id) return 1;
                            return 0;
                        })
                );
            });
        });
    }

    getProcessedMigrationNamesFromDB() {
        const self = this;
        return new Promise((resolve, reject) => {
            self.MigrationModel.findAll({
                where: {
                    processed: 1
                },
                order: [["id", "ASC"]]
            }).then(res => {
                resolve(
                    res.map(rs => {
                        return rs.fileName;
                    })
                );
            });
        });
    }

    getAllMigrationNamesFromDB() {
        const self = this;
        return new Promise((resolve, reject) => {
            self.MigrationModel.findAll().then(res => {
                resolve(
                    res.map(rs => {
                        return rs.fileName;
                    })
                );
            });
        });
    }

    undoRollback() {
        //get the list of migration files
        // get migration names from db
        // diff will the migration that was rolled back
        // insert diff to db
        // migrate
        const self = this;

        Promise.all([
            this.getMigrationFiles(),
            this.getAllMigrationNamesFromDB()
        ]).then(res => {
            self.insertMigration(_.difference(res[0], res[1])[0]).then(foo => {
                self.executeMigrations();
            });
        });
    }

    dropTables(data) {
        const migrName = this.getNewMigrationFileName("DropTables" + data[0]);
        // console.log("DATA");
        //console.log(data);
        let yamlData = {
            drop_tables: 1,
            name: migrName,
            tables: data
        };

        console.log(yamlData);
        this.registerMigration(migrName, yaml.safeDump(yamlData));
    }

    removeColumn(data) {
        const migrName = this.getNewMigrationFileName(data[0]);
        // console.log("DATA");
        // console.log(data);
        let to_table = data[0].replace("RemoveColumnsFrom", "");
        let cols = [];
        const colstart = 1;
        let yamlData = {
            remove_columns: 1,
            name: migrName,
            table_name: to_table,
            columns: []
        };

        for (let col = colstart; col < data.length; col++) {
            yamlData.columns.push(data[col]);
        }

        this.registerMigration(migrName, yaml.safeDump(yamlData));
    }

    changeColumnType(data) {
        // console.log(data);
        const migrName = this.getNewMigrationFileName(data[0]);
        let to_table = data[0].replace("ChangeTypeIn_", "");
        let yamlData = {
            change_column_type: 1,
            name: migrName,
            table_name: to_table,
            columns: []
        };

        for (let col = 1; col < data.length; col++) {
            let col_data = data[col].split(":");
            yamlData.columns.push({title: col_data[0], to: col_data[1]});
        }
        this.registerMigration(migrName, yaml.safeDump(yamlData));
    }

    renameColumn(data) {
        const migrName = this.getNewMigrationFileName(data[0]);
        //console.log("DATA");
        // console.log(data);
        let to_table = data[0].replace("RenameColumnIn", "");
        let cols = [];
        const colstart = 1;
        let yamlData = {
            rename_columns: 1,
            name: migrName,
            table_name: to_table,
            columns: []
        };

        for (let col = colstart; col < data.length; col++) {
            let col_data = data[col].split(":");

            yamlData.columns.push({from: col_data[0], to: col_data[1]});
        }

        this.registerMigration(migrName, yaml.safeDump(yamlData));
    }

    newColumns(data) {
        const migrName = this.getNewMigrationFileName(data[0]);
        // console.log("DATA");
        // console.log(data);
        let to_table = data[0].replace("AddColumnsTo_", "");
        let cols = [];
        const colstart = 1;
        let yamlData = {
            add_columns: 1,
            name: migrName,
            table_name: to_table,
            columns: []
        };

        for (let col = colstart; col < data.length; col++) {
            let col_data = data[col].split(":");
            //  console.log(data[col]);
            let col_type = col_data[1].toUpperCase();
            if (this.supportedColTypes.indexOf(col_data[1]) < 0) {
                // oops type not  supported
            }

            yamlData.columns.push({title: col_data[0], type: col_type});
        }
        this.registerMigration(migrName, yaml.safeDump(yamlData));
    }

    getUsefulArgs(argsArr, beginIdx) {
        return argsArr
            .map((arg, idx) => {
                if (idx > beginIdx) {
                    return arg;
                }
            })
            .filter(arj => {
                return arj !== undefined;
            });
    }

    migrateDB() {
        const self = this;
        /* say many devs are working on the same project
                     one dev will pull all the migration files from db
                     but his copy of db will not have the migrations
                     this functions inserts migrations to db
                     and tries to execute them
                     */

        // clear up db;
        console.log(moment().format());
        this.connection
            .query("DROP TABLE IF EXISTS posts,users,tickets;")
            .then(dropRes => {
                self.connection.query("TRUNCATE migrations ").then(dropRes => {
                    Promise.all([
                        this.getMigrationFiles(),
                        this.getAllMigrationNamesFromDB()
                    ]).then(res => {
                        const cleanFiles = res[0].map(fil => {
                            return fil.name;
                        });
                        // oh javascript weird execution order forces promises
                        const diffs = _.difference(cleanFiles, res[1]);
                        let insertPromiseArr = [];
                        diffs.forEach(diff => {
                            // console.log("Inserting diff " + diff);
                            insertPromiseArr.push(self.insertMigration(diff));
                        });

                        //  console.log("promise all exec");
                        Promise.all(insertPromiseArr).then(resIns => {
                            console.log("Trying to executing migrations");
                            self.executeMigrations();
                        });
                    });
                });
            });
    }

};
