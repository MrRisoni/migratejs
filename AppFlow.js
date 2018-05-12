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

        this.promiseFSWrite({filename: className, contents: beautyString}).then(resWrite => {
            console.log(resWrite);
            self.migr.insertMigration(className).then(resDB => {
                process.exit();
            }).catch(errDB => console.log(errDB));

        }).catch(errWrite => console.log(errWrite));

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

        this.promiseFSWrite({filename: className, contents: beautyString}).then(resWrite => {
            console.log(resWrite);
            self.migr.insertSeed(className).then(resDB => {
                process.exit();
            }).catch(errDB => console.log(errDB));

        }).catch(errWrite => console.log(errWrite));

    }


    promiseFSWrite(args)
    {
        return new Promise(function (resolve, reject) {

            fs.writeFile("seeds/" + args.filename + ".js", args.contents, function (err) {
                if (err) {
                    reject('Error writing file ' + err);
                }
                resolve('File written!');
            });
        });
    }



    executeSeeds()
    {
        const self = this;

        this.migr.SeederModel.findAll({
            where: {
                processed: 0
            },
            order: [
                ['created_at', 'ASC']
            ]
        }).then(results => {
            if (results.length >0) {
                results.forEach(res => {

                    const seedClass = require(`./seeds/${res.fileName}.js`);

                    let sd = new seedClass(self.migr);
                    console.log('Executing seed ... ' + res.fileName);

                    sd.dataFeed().then(result => {
                        self.migr.update(res.fileName);
                    });


                });
            }
            else {
                console.log('Nothing to migrate');
            }
        });
    }
}




