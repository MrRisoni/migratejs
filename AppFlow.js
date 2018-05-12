import moment from 'moment';
import fs from 'fs';
import os from 'os';
import beautify from 'js-beautify'

export default class AppFlow{

    constructor(migr) {
        this.migr = migr;

    }


    newMigration()
    {
        // make migration file
        const stamp = moment().format('YYYYMMDD_hhmmss');
        const self = this;

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
        lineFiles.push("\tlet tbl = new TableUtils('" + className + "', this.db);");
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
            self.migr.insertMigration(className);
            console.log("The file was saved!");
            process.exit();
        });

    }

    newSeed(seedName)
    {
        const stamp = moment().format('YYYYMMDD_hhmmss');
        const self = this;

        // make migration file
        const className = 'seed' + stamp + seedName;

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
        lineFiles.push("\tlet tbl = new TableUtils('" + seedName + "', this.db);");
        lineFiles.push("create().then(res => {");
        lineFiles.push(" console.log('Data Inserted Ok');");
        lineFiles.push(" resolve({dataFeeded: true}); ");
        lineFiles.push(" }).catch(err => { ");
        lineFiles.push("  console.log('data Feed NOT OK ' + JSON.stringify(err)); ");
        lineFiles.push(" reject({dataFeeded: false}) ");
        lineFiles.push("  }); ");
        lineFiles.push("  });");
        lineFiles.push("}; ");
        lineFiles.push("}; ");

        const strFile = lineFiles.join(os.EOL);
        const beautyString = beautify(strFile, { indent_size: 4 });

        fs.writeFile("seeds/" + className + ".js", beautyString, function (err) {
            if (err) {
                return console.log(err);
            }
            self.migr.insertSeed(className);
            console.log("The file was saved!");
            process.exit();
        });

    }
}




