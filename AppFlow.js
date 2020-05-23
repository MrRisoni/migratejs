import moment from 'moment';
import fs from 'fs';
import os from 'os';
import yaml from 'js-yaml';

export default class AppFlow{

    constructor(migr) {
        this.migr = migr;


       const settings = yaml.safeLoad(fs.readFileSync(this.migr.yamlConfigFile, 'utf8'));
        this.base = settings['project']['type'];



    }

    newSQLMigration()
    {
        // make SQL migration file
        const stamp = moment().format('YYYYMMDD_hhmmss');
        const self = this;

        const SQLFileName = 'migration' + stamp + process.argv[3];
        console.log('SQL ' + SQLFileName);
        let lineFiles = [];

        lineFiles.push("  ");
        lineFiles.push("  ");


        this.promiseWriteFile({filename: "migrations/sql/" +   SQLFileName + ".sql", contents: lineFiles.join(os.EOL)}).then(resWrite => {
            console.log(resWrite);
            self.migr.insertMigration(SQLFileName).then(resDB => {
                process.exit();
            }).catch(errDB => console.log(errDB));

        }).catch(errWrite => console.log(errWrite));
    }

    newMigration(args)
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



    promiseWriteFile(args)
    {
        return new Promise((resolve, reject) => {

            fs.writeFile( args.filename , args.contents,err => {
                if (err) {
                    reject('Error writing file ' + err);
                }
                resolve('File written!');
            });
        });
    }




    executeMigrations()
    {
        const self = this;

        this.migr.MigrationModel.findAll({
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

                    let mg = new migrationClass(self.migr);
                    console.log('Executing migration ... ' + res.fileName);

                    mg.schemaUp().then(result => {
                        console.log('Migration result ' + result);
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




