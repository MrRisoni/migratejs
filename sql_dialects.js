export function createdAtPostgres(prefix) {
  return prefix + "created_at timestamp";
}

export function createdAtMySql(prefix) {
  return "`" + prefix + "created_at` DATETIME";
}

export function updatedAtPostgres(prefix) {
  return prefix + "updated_at timestamp";
}

export function updatedAtMySql(prefix) {
  return "`" + prefix + "updated_at` DATETIME";
}

export function updatedAt(dialect, prfx) {
  console.log("hey dialects js ");
  console.log(prfx, dialect);
  switch (dialect) {
    case "postgres":
      return updatedAtPostgres(prfx);
    case "mysql":
      return updatedAtMySql(prfx);
  }
}

export function getAutoIncrement(dialect, data) {
  switch (dialect) {
    case "postgres":
      return " SERIAL ";
    case "mysql":
      return data["id"]["type"].toUpperCase() + " AUTO_INCREMENT ";
  }
}

export function getPrimaryKey(dialect, pKey, data) {
  return (
    this.getQuotes(dialect) +
    pKey +
    this.getQuotes(dialect) +
    " " +
    this.getAutoIncrement(dialect, data)
  );
}

export function getQuotes(dialect) {
  return dialect === "postgres" ? "" : "`";
}

export function createdAt(dialect, prfx) {
  switch (dialect) {
    case "postgres":
      return createdAtPostgres(prfx);
    case "mysql":
      return createdAtMySql(prfx);
  }
}
