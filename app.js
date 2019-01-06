import moment from 'moment';
import Migrator from './Migrator';
import AppFlow from './AppFlow';


const stamp = moment().format('YYYYMMDD_hhmmss');

const migr = new Migrator('./db_config.yml');
let chosenDb = 'development';


console.log(process.argv);
/*
if ( process.argv.length ===5) {
    chosenDb = process.argv[4];
}
console.log(chosenDb);
*/
migr.setUpDB(chosenDb);


const app_flow = new AppFlow(migr);


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
