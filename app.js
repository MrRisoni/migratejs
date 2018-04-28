import moment from 'moment';
import fs from 'fs';
import os from 'os';


console.log(moment().format('YYYYMMDD_hhmmss'));

const stamp = moment().format('YYYYMMDD_hhmmss');

import Migrator from './Migrator';
const migr = new Migrator('./db_config.yml');


if ( process.argv[2] === 'new') {
    // make migration file
    const className = 'migration' + stamp + process.argv[3];
    let strFile = " module.exports = " + os.EOL + " class  " + className + " { "  + os.EOL;
    strFile += "  schemaUp() {}; " + os.EOL;
    strFile += "  schemaDown() {}; " + os.EOL;
    strFile += " }; ";


    fs.writeFile("migrations/" + className + ".js", strFile, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    migr.insert(className);

}
else if ( process.argv[2] === 'migrate')
{
    // read the most recent migration
    migr.MigrationModel.findAll({
        where: {
            processed : 0
        }
    }).then(results => {
        results.forEach( res => {

         //   const migration20180422_083815authors = require('./migrations/migration20180422_083815authors');
            const migrationClass = require(`./migrations/${res.fileName}.js`);

            let mg = new migrationClass(migr);
          //  let mg = new migrationClass(migr);
            console.log('Executing migration ... ' + res.fileName);

            mg.schemaUp();
        } );
    })

}