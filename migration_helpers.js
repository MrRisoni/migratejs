import * as dialects from "./sql_dialects";


   export function actionA(msg)
   {
    return new Promise(resolve => {
        resolve( msg);
    });
   }




   export function actionB(msg)
   {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve( msg);
      }, 1000);
    });
   }


   export function createTableMigration(data, dbType, connection, migrationName) {
     console.log('Running  ' + migrationName);
    const selbst = this;
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

    return connection.query(createSQL);
  }



 function makeColumnSQL(col, prefix, add = 0, quote = "`") {
    let sql = quote + prefix + col.title + quote;
    console.log("making comment for col ");
    console.log(col);
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
