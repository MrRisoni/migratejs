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
else if (process.argv[2].indexOf('AddReference') >-1) {
  console.log('Creating index');
      migr.newReference(process.argv[2])
}
else if (process.argv[2] === 'migrate') {
    migr.executeMigrations();
}

if (process.argv[2] === 'rollback') {
    migr.rollback();
}


