import TableUtils from '../../TableUtils';
import Column from '../../Column';

module.exports =
    class migration20180428_053226book_genres {


        constructor(db) {
            this.db = db;
        }

        schemaUp() {
            let tbl = new TableUtils('book_genres',this.db);
            tbl.addColumn( new Column('id').setType('INT').setLen(11).setPrimary())
                .addColumn( new Column('book_id').setType('INT').setLen(56).isNotNull().setUnsigned())
                .addColumn( new Column('genre_id').setType('TINYINT').setLen(56).isNotNull().setUnsigned())
                .addIndex({ type: 'UNIQUE', columns :['book_id','genre_id']})
                .create();
        };

        schemaDown() {
        };
    };
