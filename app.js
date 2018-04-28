import moment from 'moment';
import fs from 'fs';
import os from 'os';

import  migration20180422_083815authors from './migrations/migration20180422_083815authors';


console.log(moment().format('YYYYMMDD_hhmmss'));

const stamp = moment().format('YYYYMMDD_hhmmss');

import Migrator from './Migrator';
const migr = new Migrator('./db_config.yml');


if ( process.argv[2] === 'new') {
    // make migration file
    const className = 'migration' + stamp + process.argv[3];
    let strFile = " export default class  " + className + " { "  + os.EOL;
    strFile += "  schemaUp() {}; " + os.EOL;
    strFile += "  schemaDown() {}; " + os.EOL;
    strFile += " }; ";


    fs.writeFile("migrations/" + className + ".js", strFile, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

}
else if ( process.argv[2] === 'migrate')
{
    // read the most recent migration

    let mg = new migration20180422_083815authors(migr);
    mg.schemaUp();
}