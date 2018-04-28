import TableUtils from '../TableUtils';
import Column from '../Column';

module.exports =
    class migration20180428_060946rename_pass_to_password {


        constructor(db) {
            this.db = db;
        }

        schemaUp() {
            let tbl = new TableUtils('users',this.db);
            tbl.renameColumn( { from :'pass', to:'password'})
                .alter();

        };

        schemaDown() {
        };
    };