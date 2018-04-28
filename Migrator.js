import yaml from 'js-yaml';
import fs from 'fs';
import  mysql from 'mysql2';
import Sequelize from 'sequelize';

export default class Migrator {

    constructor(ymlConfig)
    {
        this.dbg =true;
        this.connection = null;
        this.MigrationModel  =null;

        try {
            const settings = yaml.safeLoad(fs.readFileSync(ymlConfig, 'utf8'));

            this.connection = new Sequelize(settings.development.db, settings.development.user, '', {
                host: settings.development.host,
                dialect: 'mysql',
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                logging:true
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



        } catch (e) {
            console.log(e);
        }
    }

    insert(fileName)
    {
        const query = " INSERT INTO `migrations` (`file_name`) VALUES ('" + fileName +"')";
        this.connection.query(query).then(myTableRows => {});

    }

    getPendingMigrations()
    {
      return this.connection.query("SELECT file_name FROM migrations WHERE processed =0 ORDER BY created_at ASC");
    }

    update(migrationFile)
    {
        this.connection.query("UPDATE migrations SET processed = 1, " +
            " updated_at = NOW() WHERE file_name = '" + migrationFile + "' ").spread((results, metadata) => {});
     }

    run(query)
    {
        console.log(query);
        this.connection.query(query).then(myTableRows => {});

    }

    execute(query)
    {
        return  this.connection.query(query, {type: this.connection.QueryTypes.SELECT});
    }


}