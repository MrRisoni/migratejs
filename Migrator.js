import yaml from 'js-yaml';
import fs from 'fs';
import  mysql from 'mysql2';


export default class Migrator {

    constructor(ymlConfig)
    {
        this.dbg =true;

        try {
            const settings = yaml.safeLoad(fs.readFileSync(ymlConfig, 'utf8'));
            console.log(settings);

            this.connection = mysql.createConnection({
                host: settings.development.host,
                user: settings.development.user,
                password: '',
                database: settings.development.db,
            });


        } catch (e) {
            console.log(e);
        }
    }

    run(query)
    {
        console.log('Running query...');
        this.connection.query(
            query,
            function(err, results, fields) {
                console.log(err);
                process.exit();
            }
        );
    }


}