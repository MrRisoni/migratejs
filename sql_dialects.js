 function createdAtPostgres(prefix) {
  return prefix + "created_at timestamp";
}

 function createdAtMySql(prefix) {
  return "`" + prefix + "created_at` DATETIME";
}

 function updatedAtPostgres(prefix) {
  return prefix + "updated_at timestamp";
}

 function updatedAtMySql(prefix) {
  return "`" + prefix + "updated_at` DATETIME";
}

 function updatedAt(dialect, prfx) {
//  console.log("hey dialects js ");
  //console.log(prfx, dialect);
  switch (dialect) {
    case "postgres":
      return updatedAtPostgres(prfx);
    case "mysql":
      return updatedAtMySql(prfx);
  }
}

 function getAutoIncrement(dialect, data) {
  switch (dialect) {
    case "postgres":
      return " SERIAL ";
    case "mysql":
      return data["id"]["type"].toUpperCase() + " AUTO_INCREMENT ";
  }
}

 function getPrimaryKey(dialect, pKey, data) {
  return (
    getQuotes(dialect) +
    pKey +
    getQuotes(dialect) +
    " " +
    getAutoIncrement(dialect, data)
  );
}

 function getQuotes(dialect) {
  return dialect === "postgres" ? "" : "`";
}

 function createdAt(dialect, prfx) {
  switch (dialect) {
    case "postgres":
      return createdAtPostgres(prfx);
    case "mysql":
      return createdAtMySql(prfx);
  }
}


module.exports = {getQuotes,getPrimaryKey,createdAt, updatedAt};
