import moment from 'moment';
import fs from 'fs';
import os from 'os';
import beautify from 'js-beautify'
import Migrator from './Migrator';
import AppFlow from './AppFlow';


const stamp = moment().format('YYYYMMDD_hhmmss');

const migr = new Migrator('./db_config.yml');
let chosenDb = 'development';


console.log(process.argv);
console.log(process.argv.length);
/*
if ( process.argv.length ===5) {
    chosenDb = process.argv[4];
}
console.log(chosenDb);
*/
migr.setUpDB(chosenDb);


const app = new AppFlow(migr);


if (process.argv[2] === 'newseed') {
    app.newSeed(process.argv[3])
}
else if (process.argv[2] === 'newtable') { // new or newtable
    app.newMigration(process.argv[3])
}
else if (process.argv[2] === 'migrate') {
    // read the most recent migration
    migr.MigrationModel.findAll({
        where: {
            processed: 0
        },
        order: [
            ['created_at', 'ASC']
        ]
    }).then(results => {
        if (results.length >0) {
            results.forEach(res => {

                //   const migration20180422_083815authors = require('./migrations/migration20180422_083815authors');
                const migrationClass = require(`./migrations/${res.fileName}.js`);

                let mg = new migrationClass(migr);
                console.log('Executing migration ... ' + res.fileName);

                mg.schemaUp().then(result => {
                    console.log('Migration result ' + result);
                    migr.update(res.fileName);
                });


            });
        }
        else {
            console.log('Nothing to migrate');
        }
    });

}
else if (process.argv[3] === 'seed') {
    // read the most recent migration
    migr.MigrationModel.findAll({
        where: {
            processed: 0
        },
        order: [
            ['created_at', 'ASC']
        ]
    }).then(results => {
        if (results.length >0) {
            results.forEach(res => {

                //   const migration20180422_083815authors = require('./migrations/migration20180422_083815authors');
                const migrationClass = require(`./migrations/${res.fileName}.js`);

                let mg = new migrationClass(migr);
                console.log('Executing migration ... ' + res.fileName);

                mg.schemaUp().then(result => {
                    console.log('Migration result ' + result);
                    migr.update(res.fileName);
                });


            });
        }
        else {
            console.log('Nothing to migrate');
        }
    });

}