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
    console.log("migration args");
    console.log(args);

    let model_name = args[0].replace("CreateTable_", "");

    const stamp = moment().format("YYYYMMDD_hhmmss");
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
      id: { type: "bigint", unsigned: true },
      created_at: true,
      updated_at: true,
      columns: []
    };

    for (let col = colstart; col < args.length; col++) {
      let col_data = args[col].split(":");
      let col_type = col_data[1].toUpperCase();
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

 newIndex(ref) {
    // AddReferenceXTo
    const self = this;
    const stamp = moment().format("YYYYMMDD_hhmmss");

    const migrationName = "migration" + stamp + "_" + ref;

    let to_table = ref.replace("AddIndexTo_", "");
    //  console.log(to_table);
    const yamlData = {
      create_index: 1,
      table: to_table,
      name: "",
      unique: false,
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


