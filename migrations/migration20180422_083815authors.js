import TableUtils from '../TableUtils';
import Column from '../Column';


export default class migration20180422_083815authors {

    constructor(db)
    {
        this.db =db;

    }

    schemaUp() {
        console.log('Executing schema up...');
        let tbl = new TableUtils('users',this.db);
        tbl.addColumn( new Column('email').setType('VARCHAR').setLen(255).isNotNull())
           .addColumn( new Column('id').setType('INT').setLen(11).setPrimary())
           .create();
    };

    schemaDown() {
    };

};