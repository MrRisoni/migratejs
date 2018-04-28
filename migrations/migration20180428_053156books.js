import TableUtils from '../TableUtils';

import Column from '../Column';

module.exports =
    class migration20180428_053156books {


        constructor(db) {
            this.db = db;
        }

        schemaUp() {
            let tbl = new TableUtils('book',this.db);
            tbl.addColumn( new Column('id').setType('INT').setLen(11).setPrimary())
                .addColumn( new Column('title').setType('VARCHAR').setLen(255).isNotNull())
                .create();
        };

        schemaDown() {
        };
    };