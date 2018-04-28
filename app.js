import moment from 'moment';
import fs from 'fs';
import os from 'os';
import Migrator from './Migrator';


const stamp = moment().format('YYYYMMDD_hhmmss');

const migr = new Migrator('./db_config.yml');

if ( process.argv[2] === 'new') {
    // make migration file
    const className = 'migration' + stamp + process.argv[3];

    let lineFiles = [];
    lineFiles.push(" import TableUtils from '../TableUtils'; ");
    lineFiles.push(" import Column from '../Column'; ");
    lineFiles.push( " module.exports = " + os.EOL + " class  " + className + " { ");
    lineFiles.push("  ");
    lineFiles.push("  ");
    lineFiles.push(" constructor(db) ");
    lineFiles.push(" { ");
    lineFiles.push(" \tthis.db =db; ");
    lineFiles.push(" } ");
    lineFiles.push(" schemaUp() {}; ");
    lineFiles.push(" schemaDown() {}; ");
    lineFiles.push("};  ");

    const strFile = lineFiles.join(os.EOL);


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
        },
        order:[
            ['created_at', 'ASC']
        ]
    }).then(results => {
        results.forEach( res => {

         //   const migration20180422_083815authors = require('./migrations/migration20180422_083815authors');
            const migrationClass = require(`./migrations/${res.fileName}.js`);

            let mg = new migrationClass(migr);
            console.log('Executing migration ... ' + res.fileName);
            mg.schemaUp();

           //  migr.update(res.fileName);


        } );
    })

}