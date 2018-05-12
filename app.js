import moment from 'moment';
import fs from 'fs';
import os from 'os';
import beautify from 'js-beautify'
import Migrator from './Migrator';


const stamp = moment().format('YYYYMMDD_hhmmss');

const migr = new Migrator('./db_config.yml');
let chosenDb = 'development';

console.log(process.argv);
console.log(process.argv.length);

if ( process.argv.length ===4) {
    chosenDb = process.argv[3];
}
console.log(chosenDb);
migr.setUpDB(chosenDb);

if (process.argv[2] === 'newseed') {
    // make migration file
    const className = 'seed' + stamp + process.argv[3];

    let lineFiles = [];
    lineFiles.push(" import TableUtils from '../TableUtils'; ");
    lineFiles.push(" module.exports = " + os.EOL + " class  " + className + " { ");
    lineFiles.push("  ");
    lineFiles.push("  ");
    lineFiles.push(" constructor(db) ");
    lineFiles.push(" { ");
    lineFiles.push(" \tthis.db =db; ");
    lineFiles.push(" } ");
    lineFiles.push(" dataFeed() { ");
    lineFiles.push("");
    lineFiles.push("return new Promise((resolve, reject) => {");
    lineFiles.push("\tlet tbl = new TableUtils('" + process.argv[3] + "', this.db);");
    lineFiles.push("create().then(res => {");
    lineFiles.push(" console.log('Data Inserted Ok');");
    lineFiles.push(" resolve({dataFeeded: true}); ");
    lineFiles.push(" }).catch(err => { ");
    lineFiles.push("  console.log('data Feed NOT OK ' + JSON.stringify(err)); ");
    lineFiles.push(" reject({dataFeeded: false}) ");
    lineFiles.push("  }); ");
    lineFiles.push("  });");
    lineFiles.push("}; ");

    const strFile = lineFiles.join(os.EOL);
    const beautyString = beautify(strFile, { indent_size: 4 });

    fs.writeFile("seeds/" + className + ".js", beautyString, function (err) {
        if (err) {
            return console.log(err);
        }
        migr.insert(className);
        console.log("The file was saved!");
        process.exit();
    });

}
else if (process.argv[2] === 'newtable') { // new or newtable
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
    lineFiles.push(" schemaUp() { ");
    lineFiles.push("");
    lineFiles.push("return new Promise((resolve, reject) => {");
    lineFiles.push("\tlet tbl = new TableUtils('" + process.argv[3] + "', this.db);");
    lineFiles.push("create().then(res => {");
    lineFiles.push(" console.log('Schema Up Ok');");
    lineFiles.push(" resolve({schemaUp: true}); ");
    lineFiles.push(" }).catch(err => { ");
    lineFiles.push("  console.log('Schema Up NOT OK ' + JSON.stringify(err)); ");
    lineFiles.push(" reject({schemaUp: false}) ");
    lineFiles.push("  }); ");
    lineFiles.push("  });");
    lineFiles.push("}; ");

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