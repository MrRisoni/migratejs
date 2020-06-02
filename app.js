import Migrator from './Migrator'

const migr = new Migrator("./.env.yml");
let chosenDb = "development";

migr.setUpDB(chosenDb);
var rest_args = [];
console.log("log args");
console.log(process.argv);
if (process.argv[2].indexOf("CreateTable") > -1) {
    rest_args = process.argv.map((arg, idx) => {
        if (idx >1) {
            return arg;
        }
    }).filter(arj => {
        return arj!== undefined;
    })
    migr.newTable(rest_args);
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
    console.log("Removing index");
    rest_args = process.argv.map((arg, idx) => {
        if (idx >1) {
            return arg;
        }
    }).filter(arj => {
        return arj!== undefined;
    })
    migr.removeIndex(rest_args);
}
else if (process.argv[2].indexOf("AddColumns") > -1) {
    rest_args = process.argv.map((arg, idx) => {
        if (idx >1) {
            return arg;
        }
    }).filter(arj => {
        return arj!== undefined;
    })
    migr.newColumns(rest_args);
} else if (process.argv[2] === "migrate") {
    migr.executeMigrations();
} else if (process.argv[2].indexOf("RenameColumn") > -1) {
    rest_args = process.argv.map((arg, idx) => {
        if (idx >1) {
            return arg;
        }
    }).filter(arj => {
        return arj!== undefined;
    })
    migr.renameColumn(rest_args);
} else if (process.argv[2].indexOf("ChangeType") > -1) {
    var  rest_args = process.argv.map((arg, idx) => {
        if (idx >1) {
            return arg;
        }
    }).filter(arj => {
        return arj!== undefined;
    })
    migr.changeColumnType(rest_args);
} else if (process.argv[2].indexOf("RemoveColumns") > -1) {
    rest_args = process.argv.map((arg, idx) => {
        if (idx >1) {
            return arg;
        }
    }).filter(arj => {
        return arj!== undefined;
    })
    migr.removeColumn(rest_args);
} else if (process.argv[2] === "DropTables") {
    rest_args = process.argv.map((arg, idx) => {
        if (idx >2) {
            return arg;
        }
    }).filter(arj => {
        return arj!== undefined;
    })

    migr.dropTables(rest_args);
} else if (process.argv[2] === "rollback") {
    migr.rollback();
} else if (process.argv[2] === "undorollback") {
    migr.undoRollback();
}
