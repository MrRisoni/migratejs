import TableUtils from '../TableUtils';

export default class migration20180422_083815authors {

    constructor(db)
    {
        this.db =db;

    }

    schemaUp() {
        console.log('Executing schema up...');
        let tbl = new TableUtils('users',this.db);
        tbl.addColumn( new Column('id').type('VARCHAR(255'))
            .addColumn('email')
            .create();
    };

    schemaDown() {
    };

};