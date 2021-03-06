const Sequelize = require("sequelize");
const dialects = require("./sql_dialects");
const fs = require("fs");
const os = require("os");

function createTableMigration(migrFuncArgs) {
  return new Promise((resolve, reject) => {
    const data = migrFuncArgs.data;
    const conn = migrFuncArgs.conn;
    const migrationName = migrFuncArgs.migrName;
    const dbType = "mysql";

    console.log("Running  " + migrationName);
    let prefix = data.prefix + "_";
    let pKey = prefix + "id";
    let pKeysList = [pKey];
    let quote = dialects.getQuotes(dbType);

    let columnsSQL = [dialects.getPrimaryKey(dbType, pKey, data)];

    data.columns.forEach((item, i) => {
      if (item.primary) {
        pKeysList.push(prefix + item.title);
      }
      columnsSQL.push(makeColumnSQL(item, prefix, 0, quote));
    });

    if (data.created_at) {
      columnsSQL.push(dialects.createdAt(dbType, prefix));
    }
    if (data.updated_at) {
      columnsSQL.push(dialects.updatedAt(dbType, prefix));
    }

    columnsSQL.push(" PRIMARY KEY (" + pKeysList.join(",") + ")");

    let createSQL =
      " CREATE TABLE " + data.table_name + " ( " + columnsSQL.join(",") + ") ";

    if (typeof data.engine !== "undefined") {
      createSQL += " ENGINE =  " + data.engine;
    }
    if (typeof data.comment !== "undefined" && data.comment.length > 0) {
      createSQL += " COMMENT '" + data.comment + "'";
    }
    console.log(createSQL);
    // return conn.query(createSQL);
    conn.query(createSQL).then(createTableRes => {
      markAsDone(conn, migrationName).then(notifiedDBRes => {
        resolve();
      });
    });
  });
}

function makeColumnSQL(col, prefix, add = 0, quote = "`") {
  let sql = quote + prefix + col.title + quote;
  //console.log("making comment for col ");
  // console.log(col);
  switch (col.type) {
    case "DATE":
      sql += "  " + col.type;
      break;
    case "STRING":
      if (typeof col.len === "undefined") {
        sql += " VARCHAR(255) "; //" COLLATE " + col.options[0]['collation']
      } else {
        sql += " VARCHAR(" + col.len + ") ";
      }
      break;
    case "INT":
    case "TINYINT":
      sql += "  " + col.type;
      if (typeof col.unsigned !== "undefined") {
        sql += " UNSIGNED ";
      }
      if (typeof col.defaultVal !== "undefined") {
        sql += " DEFAULT " + col.defaultVal;
      }
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

  if (typeof col.defaultVal !== "undefined") {
    sql += " DEFAULT " + col.defaultVal;
  }

  if (typeof col.not_null !== "undefined") {
    if (col.not_null) {
      sql += " NOT NULL ";
    }
  }

  if (add === 1) {
    sql = " ADD COLUMN " + sql;
  }
  if (typeof col.after !== "undefined") {
    sql += " AFTER " + col.after;
  }

  if (typeof col.comment !== "undefined" && col.comment.length > 0) {
    sql += " COMMENT '" + col.comment + "'";
  }

  return sql;
}

function addColumnMigration(migrFuncArgs) {
  const data = migrFuncArgs.data;
  const conn = migrFuncArgs.conn;
  const migrName = migrFuncArgs.migrName;
  console.log("Running  " + migrName);

  return new Promise((resolve, reject) => {
    const to_table = data.table_name;
    // get prefix
    // console.log("Add Cols");
    conn.query("SHOW COLUMNS FROM " + to_table).then(cols => {
      const first_col = cols[0][0].Field;
      let prfx = first_col.split("_")[0];
      if (prfx.length > 0) {
        prfx += "_";
      }
      //   console.log(prfx);
      let columnsSQL = [];
      data.columns.forEach((item, i) => {
        columnsSQL.push(makeColumnSQL(item, prfx, 1));
      });
      //   console.log(columnsSQL);

      let alterSQL = " ALTER TABLE " + to_table + "  " + columnsSQL.join(",");
      console.log(alterSQL);
      conn.query(alterSQL).then(ff => {
        markAsDone(conn, migrName).then(notifiedDBRes => {
          resolve();
        });
      });
    });
  });
}

function renameColumnMigration(migrFuncArgs) {
  const data = migrFuncArgs.data;
  const conn = migrFuncArgs.conn;
  const migrName = migrFuncArgs.migrName;

  console.log("Running  " + migrName);

  //console.log(" rename cols ");
  const self = this;
  console.log("SHOW COLUMNS FROM " + data.table_name);

  return new Promise((resolve, reject) => {
    conn
      .query("SHOW COLUMNS FROM " + data.table_name, {
        type: Sequelize.QueryTypes.SELECT
      })
      .then(cols => {
        console.log(cols);
        let colObj = cols.filter(clitm => {
          return clitm.Field === data.columns[0].from;
        });
        console.log("Col obj");
        //  console.log(colObj);
        if (colObj.length == 0) {
          console.log("No such column " + data.columns[0].from);
        }
        const changeSQL =
          "ALTER TABLE " +
          data.table_name +
          " CHANGE " +
          data.columns[0].from +
          " " +
          data.columns[0].to +
          " " +
          colObj[0].Type;

        console.log(changeSQL);
        conn.query(changeSQL).then(res => {
          markAsDone(conn, migrName).then(notifiedDBRes => {
            resolve();
          });
        });
      })
      .catch(err2 => {
        console.log("err2");
        console.log(err2);
        reject();
      });
  });
}

function removeColumnMigration(migrFuncArgs) {
  const data = migrFuncArgs.data;
  const conn = migrFuncArgs.conn;
  const migrName = migrFuncArgs.migrName;
  console.log("Running  " + migrName);

  return new Promise((resolve, reject) => {
    const changeSQL =
      "ALTER TABLE " + data.table_name + " DROP COLUMN " + data.columns[0];

    console.log(changeSQL);
    conn.query(changeSQL).then(changeRes => {
      markAsDone(conn, migrName).then(notifiedDBRes => {
        resolve();
      });
    });
  });
}

function dropTableMigration(migrFuncArgs) {
  console.log("Dropping table");

  const data = migrFuncArgs.data;
  const conn = migrFuncArgs.conn;
  const migrationName = migrFuncArgs.migrName;
  const dropSQL = "DROP  TABLE " + data.tables[0];

  console.log(dropSQL);

  return new Promise((resolve, reject) => {
    conn.query(dropSQL).then(changeRes => {
      markAsDone(conn, migrName).then(notifiedDBRes => {
        resolve();
      });
    });
  });
}

function markAsDone(connection, migrationFile) {
  console.log("Registering " + migrationFile + " as complete");
  const self = this;
  return new Promise((resolve,reject) => {
    connection.query(
      "UPDATE migrations SET processed = 1, updated_at = NOW() " +
        " WHERE file_name = '" +
        migrationFile +
        "' ",
      { type: Sequelize.QueryTypes.UPDATE }
    ).then(updRes => {
        updateLogFile("XC " + migrationFile).then(recorded => {
           resolve();
        })
    })
  });
  /*return  */

}



function updateLogFile(record) {
  return new Promise((resolve,reject) => {
  fs.appendFile('history.log', record + os.EOL, err => {
    if (err) throw err;
    console.log('Saved!');
    resolve();
  });
});
  
}


module.exports = {
  removeColumnMigration,
  createTableMigration,
  renameColumnMigration,
  addColumnMigration,
  dropTableMigration
};
