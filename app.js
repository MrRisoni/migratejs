const moment = require('moment');
const Migrator = require('./Migrator');

// $ ./node_modules/@babel/node/bin/babel-node.js app.js

const stamp = moment().format('YYYYMMDD_hhmmss');

const migr = new Migrator('./.env.yml');
let chosenDb = 'development';


/*
if ( process.argv.length ===5) {
    chosenDb = process.argv[4];
}
console.log(chosenDb);
*/
migr.setUpDB(chosenDb);

console.log('log args');
console.log(process.argv)
if (process.argv[2] === 'g' && process.argv[3] === 'model') {
    var rest_args = [];
    process.argv.forEach((arg,idx) => {
        if (idx>3) {
           // return arg;
            rest_args.push(arg)
        }
    });
    migr.newMigration(rest_args)
}
else if (process.argv[2] === 'migrate') {
    migr.executeMigrations();
}
/*
if (process.argv[2] === 'newseed') {
    app_flow.newSeed(process.argv[3])
}
else if (process.argv[2] === 'newsql') {
    app_flow.newSQLMigration(process.argv[3]);
}
else if (process.argv[2] === 'newtable') { // new or newtable
    app_flow.newMigration(process.argv[3])
}
else if (process.argv[2] === 'migrate') {
    app_flow.executeMigrations();
}
else if (process.argv[2] === 'seed') {
    app_flow.executeSeeds();
}
*/