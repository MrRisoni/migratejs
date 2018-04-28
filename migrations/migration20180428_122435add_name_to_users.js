import TableUtils from '../TableUtils';
import Column from '../Column';

module.exports =
    class migration20180428_122435add_name_to_users {


        constructor(db) {
            this.db = db;
        }

        schemaUp() {
        };

        schemaDown() {
        };
    };