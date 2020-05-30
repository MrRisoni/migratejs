const moment = require("moment");
const Migrator = require("./Migrator");

// $ ./node_modules/@babel/node/bin/babel-node.js app.js

const stamp = moment().format("YYYYMMDD_hhmmss");

const migr = new Migrator("./.env.yml");
let chosenDb = "development";

/*
if ( process.argv.length ===5) {
    chosenDb = process.argv[4];
}
console.log(chosenDb);
*/
migr.setUpDB(chosenDb);

console.log("log args");
console.log(process.argv);
if (process.argv[2] === "g" && process.argv[3] === "model") {
  var rest_args = [];
  process.argv.forEach((arg, idx) => {
    if (idx > 3) {
      // return arg;
      rest_args.push(arg);
    }
  });
  migr.newMigration(rest_args);
} else if (process.argv[2].indexOf("AddReference") > -1) {
  console.log("Creating index");
  migr.newReference(process.argv[2]);
} else if (process.argv[2].indexOf("AddIndex") > -1) {
  console.log("Creating index");
  migr.newIndex(process.argv[2]);
} else if (process.argv[2].indexOf("AddColumns") > -1) {
  var rest_args = [];
  process.argv.forEach((arg, idx) => {
    if (idx > 1) {
      rest_args.push(arg);
    }
  });
  migr.newColumns(rest_args);
} else if (process.argv[2] === "migrate") {
  migr.executeMigrations();
} else if (process.argv[2].indexOf("RenameColumn") > -1) {
  var rest_args = [];
  process.argv.forEach((arg, idx) => {
    if (idx > 1) {
      rest_args.push(arg);
    }
  });
  migr.renameColumn(rest_args);
} else if (process.argv[2].indexOf("RemoveColumns") > -1) {
  var rest_args = [];
  process.argv.forEach((arg, idx) => {
    if (idx > 1) {
      rest_args.push(arg);
    }
  });
  migr.removeColumn(rest_args);
} else if (process.argv[2] === "DropTables") {
  var rest_args = [];
  process.argv.forEach((arg, idx) => {
    if (idx > 2) {
      rest_args.push(arg);
    }
  });
  migr.dropTables(rest_args);
} else if (process.argv[2] === "rollback") {
  migr.rollback();
} else if (process.argv[2] === "undorollback") {
  migr.undoRollback();
}
