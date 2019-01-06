import TableUtils from '../../TableUtils';
import Column from '../../Column';

module.exports =
    class migration20180428_122435add_pass_to_users {


        constructor(db) {
            this.db = db;
        }

        schemaUp() {

            let tbl = new TableUtils('users',this.db);
            tbl.addColumn( new Column('pass').setType('VARCHAR').setLen(600).isNotNull())
                .alter();

        };

        schemaDown() {
        };
    };
