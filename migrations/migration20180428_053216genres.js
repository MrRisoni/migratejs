import TableUtils from '../TableUtils';
import Column from '../Column';

module.exports =
    class migration20180428_053216genres {


        constructor(db) {
            this.db = db;
        }

        schemaUp() {
            let tbl = new TableUtils('genres',this.db);
            tbl.addColumn( new Column('id').setType('TINYINT').setLen(11).setPrimary())
                .addColumn( new Column('title').setType('VARCHAR').setLen(56).isNotNull())
                .create();
        };

        schemaDown() {
        };
    };