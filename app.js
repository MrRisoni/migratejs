import moment from 'moment';
import fs from 'fs';
import os from 'os';
import beautify from 'js-beautify'
import Migrator from './Migrator';


const stamp = moment().format('YYYYMMDD_hhmmss');

const migr = new Migrator('./db_config.yml');

if (process.argv[2] === 'new') {
    // make migration file
    const className = 'migration' + stamp + process.argv[3];

    let lineFiles = [];
    lineFiles.push(" import TableUtils from '../TableUtils'; ");
    lineFiles.push(" import Column from '../Column'; ");
    lineFiles.push(" module.exports = " + os.EOL + " class  " + className + " { ");
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
    const beautyString = beautify(strFile, { indent_size: 4 });

    fs.writeFile("migrations/" + className + ".js", beautyString, function (err) {
        if (err) {
            return console.log(err);
        }
        migr.insert(className);
        console.log("The file was saved!");
        process.exit();
    });


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
    })

}