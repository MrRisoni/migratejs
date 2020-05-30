const moment = require("moment");
const yaml = require("js-yaml");
const fs = require("fs");
const natural = require("natural");
const path = require("path");

var Sequelize = require("sequelize");

module.exports = class Migrator {
  constructor(ymlConfig) {
    this.dbg = true;
    this.connection = null;
    this.MigrationModel = null;
    this.yamlConfigFile = ymlConfig;
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

  setUpDB(dbOption) {
    try {
      const projectSettings = yaml.safeLoad(
        fs.readFileSync(this.yamlConfigFile, "utf8")
      );
      const settings = projectSettings["database"];
      console.log("connecting to " + dbOption);
      console.log(settings[dbOption]);

      this.connection = new Sequelize(
        settings[dbOption].db,
        settings[dbOption].user,
        settings[dbOption].pass,
        {
          host: settings[dbOption].host,
          dialect: "mysql",
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
          processes: {
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

  newMigration(args) {
    console.log("migration args");
    console.log(args);
    var nounInflector = new natural.NounInflector();

    let model_name = nounInflector.pluralize(args[0]).toLowerCase();

    const stamp = moment().format("YYYYMMDD_hhmmss");
    const self = this;

    const migrationName = "migration" + stamp + "_" + model_name;

    let prfx = "";
    let colstart = 1;
    if (args[1].indexOf("--prefix") > -1) {
      colstart = 2;
      console.log(args[1]);
      var tmp = args[1].split("=");
      prfx = tmp[1];
    }

    let yamlData = {
      create_table: 1,
      prefix: prfx,
      name: migrationName,
      table_name: model_name,
      id: { type: "bigint", unsigned: true },
      created_at: true,
      updated_at: true,
      columns: []
    };

    for (var col = colstart; col < args.length; col++) {
      var col_data = args[col].split(":");
      var col_type = col_data[1].toUpperCase();
      if (this.supportedColTypes.indexOf(col_data[1]) < 0) {
        // oops type not  supported
      }

      yamlData.columns.push({ title: col_data[0], type: col_type });
    }
    console.log(yamlData);

    let yamlStr = yaml.safeDump(yamlData);

    this.writeMigrationFile({ filename: migrationName, contents: yamlStr })
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

  writeMigrationFile(args) {
    return new Promise((resolve, reject) => {
      fs.writeFile(
        "migrations/" + args.filename + ".yaml",
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
    const query =
      " INSERT INTO `migrations` (`file_name`,`processed`, `created_at`) VALUES ('" +
      fileName +
      "',0, NOW())";
    return this.connection.query(query);
  }

  update(migrationFile) {
    this.connection
      .query(
        "UPDATE migrations SET processed = 1 " +
          " WHERE file_name = '" +
          migrationFile +
          "' "
      )
      .spread((results, metadata) => {});
  }

  run(query) {
    console.log(query);
    this.connection.query(query).then(myTableRows => {});
  }

  execute(query) {
    return new Promise((resolve, reject) => {
      this.connection
        .query(query, { type: Sequelize.QueryTypes.RAW })
        .then(rows => {
          console.log("Exe Migrator_execute");
          resolve({ proceed: true });
        })
        .catch(err => {
          console.log("Err Migrator_execute " + err);

          reject({ proceed: false });
        });
    });
  }

  runGenericQuery(sql) {
    return new Promise((resolve, reject) => {
      this.connection
        .query(sql, { type: Sequelize.QueryTypes.RAW })
        .then(rows => {
          resolve({ proceed: true });
        })
        .catch(err => {
          console.log(err);
          reject({ proceed: false });
        });
    });
  }

  executeMigrations() {
    const self = this;

    self.MigrationModel.findAll({
      where: {
        processed: 0
      },
      order: [["created_at", "ASC"]]
    }).then(results => {
      if (results.length > 0) {
        results.forEach(res => {
          console.log(res.fileName);
          let fileContents = fs.readFileSync(
            `./migrations/${res.fileName}.yaml`,
            "utf8"
          );
          let data = yaml.safeLoad(fileContents);
          let prefix = data.prefix + "_";
          console.log(data);
          const to_table = data.table_name;

          if (data.drop_tables) {
            console.log("Dropping table");
            const dropSQL = "DROP  TABLE " + data.tables[0];
            console.log(dropSQL);

            this.connection.query(dropSQL).then(success => {
              this.update(res.fileName);
            });
          } else if (data.remove_columns == 1) {
            console.log(" rename cols ");

            const changeSQL =
              "ALTER TABLE " + to_table + " DROP COLUMN " + data.columns[0];

            console.log(changeSQL);
            this.connection.query(changeSQL).then(success => {
              this.update(res.fileName);
            });
          } else if (data.rename_columns == 1) {
            console.log(" rename cols ");

            this.connection
              .query("SHOW COLUMNS FROM " + to_table)
              .then(cols => {
                console.log(cols[0]);
                let colObj = cols[0].filter(clitm => {
                  return clitm.Field == data.columns[0].from;
                });
                console.log("Col obj");
                console.log(colObj);
                const changeSQL =
                  "ALTER TABLE " +
                  to_table +
                  " CHANGE " +
                  data.columns[0].from +
                  " " +
                  data.columns[0].to +
                  " " +
                  colObj[0].Type;

                console.log(changeSQL);
                this.connection.query(changeSQL).then(success => {
                  this.update(res.fileName);
                });
              })
              .catch(err => {
                console.log(err);
              });
          } else if (data.add_colums) {
            const to_table = data.table_name;
            // get prefix
            console.log("Add Cols");
            this.connection
              .query("SHOW COLUMNS FROM " + to_table)
              .then(cols => {
                const first_col = cols[0][0].Field;
                let prfx = first_col.split("_")[0];
                if (prfx.length > 0) {
                  prfx += "_";
                }
                console.log(prfx);
                let columnsSQL = [];
                data.columns.forEach((item, i) => {
                  columnsSQL.push(this.makeColumnSQL(item, prfx, 1));
                });
                console.log(columnsSQL);

                let alterSQL =
                  " ALTER TABLE " + to_table + "  " + columnsSQL.join(",");
                console.log(alterSQL);
                this.connection.query(alterSQL).then(success => {
                  this.update(res.fileName);
                });
              });
          } else if (data.create_index == 1) {
            console.log("creating index");
            let cols = data.columns.map(col => {
              return col.title;
            });
            let to_table = this.nlpTable(data.table);

            let indexSQL =
              "CREATE " + data.type + " INDEX " + data.name + " ON " + to_table;
            indexSQL += " ( " + cols.join(",") + ")";
            console.log(indexSQL);
            this.connection.query(indexSQL).then(success => {
              this.connection.query(
                "UPDATE migrations SET processed=1 WHERE id = '" + res.id + "' "
              );
            });
          } else if (data.create_table == 1) {
            console.log(data);
            let pKey = prefix + "id";
            let pKeysList = [pKey];
            let columnsSQL = [
              "`" +
                pKey +
                "`  " +
                data["id"]["type"].toUpperCase() +
                " AUTO_INCREMENT "
            ];
            data.columns.forEach((item, i) => {
              if (item.primary) {
                pKeysList.push(prefix + item.title);
              }
              columnsSQL.push(this.makeColumnSQL(item, prefix));
            });

            if (data.created_at) {
              columnsSQL.push("`" + prefix + "created_at` DATETIME");
            }
            if (data.updated_at) {
              columnsSQL.push("`" + prefix + "updated_at` DATETIME");
            }

            columnsSQL.push(" PRIMARY KEY (" + pKeysList.join(",") + ")");

            let createSQL =
              " CREATE TABLE " +
              data.table_name +
              " ( " +
              columnsSQL.join(",") +
              ")";

            console.log(createSQL);
            console.log(res.id + " " + res.fileName);

            this.connection.query(createSQL).then(success => {
              this.connection.query(
                "UPDATE migrations SET processed=1 WHERE id = '" + res.id + "' "
              );
            });
          }
        });
      } else {
        console.log("Nothing to migrate");
      }
    });
  }

  makeColumnSQL(col, prefix, add = 0) {
    let sql = "`" + prefix + col.title + "`";

    switch (col.type) {
      case "STRING":
        sql += " VARCHAR(255) "; //" COLLATE " + col.options[0]['collation']
        break;
      case "INT":
        sql += " INT ";
        break;
      case "TEXT":
        sql += " TEXT "; //" COLLATE " + col.options[0]['collation']
        break;
      case "DECIMAL":
        sql +=
          " DECIMAL(" +
          col.options[0]["precision"] +
          "," +
          col.options[0]["scale"] +
          ")";
        if (col.options[0]["unsigned"]) {
          sql += " UNSIGNED ";
        }
        if (col.options[0]["not_null"]) {
          sql += " NOT NULL ";
        }
        sql += " DEFAULT '0' ";

        break;
      default:
        sql = "";
    }
    if (add === 1) {
      sql = " ADD COLUMN " + sql;
    }
    return sql;
  }

  getNewMigrationFileName(ref) {
    const stamp = moment().format("YYYYMMDD_hhmmss");
    return "migration" + stamp + "_" + ref;
  }

  registerMigration(migrationName, yamlStr) {
    const self = this;
    this.writeMigrationFile({ filename: migrationName, contents: yamlStr })
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

  newIndex(ref) {
    // AddReferenceXTo
    const self = this;
    const stamp = moment().format("YYYYMMDD_hhmmss");

    const migrationName = "migration" + stamp + "_" + ref;

    let to_table = ref.replace("AddIndexTo", "");
    console.log(to_table);
    const yamlData = {
      create_index: 1,
      table: to_table,
      name: "",
      type: "UNIQUE",
      columns: [{ title: "ColA" }]
    };
    let yamlStr = yaml.safeDump(yamlData);

    this.writeMigrationFile({ filename: migrationName, contents: yamlStr })
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

  newReference(ref) {
    console.log(ref);

    // AddReferenceXToY
    ref = ref.replace("AddReference", "");
    console.log(ref);
    const data = ref.split("To");
    let from_table = data[0];
    let to_table = data[1];
    let ref_col = "";

    var natural = require("natural");
    var nounInflector = new natural.NounInflector();
    console.log(nounInflector.pluralize("radius"));

    console.log(from_table + " " + to_table + ref_col);
    // get primary key

    this.connection
      .query("SHOW KEYS FROM '" + to_table + "' WHERE Key_name = 'PRIMARY'")
      .then(rsl => {
        const pkey = rsl.Column_name;
      });
  }

  rollback() {
    // only for create table now
    console.log("Rollback qery");
    this.MigrationModel.findAll({
      where: {
        processed: 1
      },
      limit: 1,
      order: [["created_at", "DESC"]]
    }).then(foo => {
      console.log(foo[0].fileName);
      const rollingBackName = foo[0].fileName;
      const rollingBackId = foo[0].id;

      let fileContents = fs.readFileSync(
        `./migrations/${rollingBackName}.yaml`,
        "utf8"
      );
      let data = yaml.safeLoad(fileContents);
      if (data.create_table == 1) {
        const dropSql = "DROP TABLE " + data.table_name;
        this.connection
          .query(dropSql)
          .then(res => {
            this.connection
              .query(
                "DELETE FROM  migrations WHERE id = '" + rollingBackId + "' "
              )
              .then(res => {
                console.log("OK!");
              })
              .catch(err1 => {
                console.log(err1);
              });
          })
          .catch(err2 => {
            console.log(err2);
          });
      } else if (data.create_index == 1) {
        const dropSql =
          " DROP INDEX " + data.name + " ON " + this.nlpTable(data.table);
        this.deleteMigration(dropSql, rollingBackId);
      }
    });
  }

  nlpTable(model_name) {
    var nounInflector = new natural.NounInflector();
    return nounInflector.pluralize(model_name).toLowerCase();
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

  undoRollback() {
    //get the list of migration files
    // get migration names from db
    // diff
    // insert diff to db
    // migrate

    // or just get the last file
    const self = this;
    const directoryPath = path.join(__dirname, "migrations");
    fs.readdir(directoryPath, function(err, files) {
      const noyml = files.map(fil => {
        return fil.replace(".yaml", "");
      });
      const lastMigration = noyml.pop();
      console.log(lastMigration);

      self.insertMigration(lastMigration).then(foo => {
        self.executeMigrations();
      });
    });
  }

  dropTables(data) {
    const migrName = this.getNewMigrationFileName("DropTables" + data[0]);
    console.log("DATA");
    console.log(data);
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
    console.log("DATA");
    console.log(data);
    let to_table = data[0].replace("RemoveColumnsFrom", "");
    let cols = [];
    const colstart = 1;
    let yamlData = {
      remove_columns: 1,
      name: migrName,
      table_name: to_table,
      columns: []
    };

    for (var col = colstart; col < data.length; col++) {
      yamlData.columns.push(data[col]);
    }

    this.registerMigration(migrName, yaml.safeDump(yamlData));
  }

  renameColumn(data) {
    const migrName = this.getNewMigrationFileName(data[0]);
    console.log("DATA");
    console.log(data);
    let to_table = data[0].replace("RenameColumnIn", "");
    let cols = [];
    const colstart = 1;
    let yamlData = {
      rename_columns: 1,
      name: migrName,
      table_name: to_table,
      columns: []
    };

    for (var col = colstart; col < data.length; col++) {
      var col_data = data[col].split(":");

      yamlData.columns.push({ from: col_data[0], to: col_data[1] });
    }

    this.registerMigration(migrName, yaml.safeDump(yamlData));
  }

  newColumns(data) {
    const migrName = this.getNewMigrationFileName(data[0]);
    console.log("DATA");
    console.log(data);
    let to_table = data[0].replace("AddColumnsTo", "");
    let cols = [];
    const colstart = 1;
    let yamlData = {
      add_colums: 1,
      name: migrName,
      table_name: to_table,
      columns: []
    };

    for (var col = colstart; col < data.length; col++) {
      var col_data = data[col].split(":");
      console.log(data[col]);
      var col_type = col_data[1].toUpperCase();
      if (this.supportedColTypes.indexOf(col_data[1]) < 0) {
        // oops type not  supported
      }

      yamlData.columns.push({ title: col_data[0], type: col_type });
    }
    this.registerMigration(migrName, yaml.safeDump(yamlData));
  }
};
