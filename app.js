const Migrator = require("./Migrator");

const migr = new Migrator("./.env.yml");
let chosenDb = "mysqldb";

migr.setUpDB(chosenDb);
if (process.argv[2].indexOf("CreateTable") > -1) {
  migr.newTable(migr.getUsefulArgs(process.argv, 1));
} else if (process.argv[2].indexOf("AddReference") > -1) {
  console.log("Creating index");
  migr.newReference(process.argv[2]);
} else if (process.argv[2].indexOf("AddForeignKey") > -1) {
  console.log("Creating ForeignKey");
  migr.newForeignKey(process.argv[2]);
} else if (process.argv[2].indexOf("AddIndex") > -1) {
  console.log("Creating index");
  migr.newIndex(process.argv[2]);
} else if (process.argv[2].indexOf("RemoveIndexFrom") > -1) {
  migr.removeIndex(migr.getUsefulArgs(process.argv, 1));
} else if (process.argv[2].indexOf("AddColumns") > -1) {
  migr.newColumns(migr.getUsefulArgs(process.argv, 1));
} else if (process.argv[2] === "init") {
  migr.init();
} else if (process.argv[2] === "migrate") {
  migr.migrateDB();
} else if (process.argv[2].indexOf("RenameColumn") > -1) {
  migr.renameColumn(migr.getUsefulArgs(process.argv, 1));
} else if (process.argv[2].indexOf("ChangeType") > -1) {
  migr.changeColumnType(migr.getUsefulArgs(process.argv, 1));
} else if (process.argv[2].indexOf("RemoveColumns") > -1) {
  migr.removeColumn(migr.getUsefulArgs(process.argv, 1));
} else if (process.argv[2] === "DropTables") {
  migr.dropTables(migr.getUsefulArgs(process.argv, 2));
} else if (process.argv[2] === "rollback") {
  migr.rollback();
} else if (process.argv[2] === "undorollback") {
  migr.migrateDB();
} else {
  console.log("Unknown command " + process.argv[2]);
}
