import yaml from 'js-yaml';
import fs from 'fs';
import mysql from 'mysql2';
import Sequelize from 'sequelize';

export default class Migrator {

    constructor(ymlConfig) {
        this.dbg = true;
        this.connection = null;
        this.MigrationModel = null;
        this.SeederModel = null;
        this.yamlConfigFile = ymlConfig;
    }

    setUpDB(dbOption){

        try {
            const settings = yaml.safeLoad(fs.readFileSync(this.yamlConfigFile, 'utf8'));
            console.log('connecting to ' + dbOption);

            this.connection = new Sequelize(settings[dbOption].db, settings[dbOption].user, '', {
                host: settings[dbOption].host,
                dialect: 'mysql',
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                logging: true
            });


            this.connection
                .authenticate()
                .then(() => {
                    console.log('Connection has been established successfully.');
                })
                .catch(err => {
                    console.error('Unable to connect to the database:', err);
                });


            this.MigrationModel = this.connection.define('migrations', {
                    id: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: 'id',
                        autoIncrement: true,
                        primaryKey: true,
                    },
                    fileName: {
                        type: Sequelize.CHAR,
                        field: 'file_name'
                    },
                    processes: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: 'processed'
                    }
                },
                {
                    timestamps: false,
                    freezeTableName: true
                }
            );


            this.SeederModel = this.connection.define('seeds', {
                    id: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: 'id',
                        autoIncrement: true,
                        primaryKey: true,
                    },
                    fileName: {
                        type: Sequelize.CHAR,
                        field: 'file_name'
                    },
                    processes: {
                        type: Sequelize.INTEGER.UNSIGNED,
                        field: 'processed'
                    }
                },
                {
                    timestamps: false,
                    freezeTableName: true
                }
            );


        } catch (e) {
            console.log(e);
        }
    }

    insertMigration(fileName) {
        const query = " INSERT INTO `migrations` (`file_name`) VALUES ('" + fileName + "')";
        this.connection.query(query).then(myTableRows => {});
    }

    insertSeed(fileName) {
        const query = " INSERT INTO `seeds` (`file_name`) VALUES ('" + fileName + "')";
        console.log(query);
        return this.connection.query(query, { type: this.connection.QueryTypes.INSERT});
    }


    update(migrationFile) {
        this.connection.query("UPDATE migrations SET processed = 1, " +
            " updated_at = NOW() WHERE file_name = '" + migrationFile + "' ").spread((results, metadata) => {
        });
    }

    run(query) {
        console.log(query);
        this.connection.query(query).then(myTableRows => {
        });

    }

    execute(query) {
        return new Promise((resolve, reject ) => {
            this.connection.query(query, {type: Sequelize.QueryTypes.RAW}).then(rows => {
                console.log('Exe Migrator_execute');
                resolve({proceed: true});

            }).catch(err => {
                console.log('Err Migrator_execute ' + err);

                reject({proceed: false});
            });
        });
    }


}