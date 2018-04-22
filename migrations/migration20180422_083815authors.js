import TableUtils from './TableUtils';

 export default class  migration20180422_083815authors
 {

 schemaUp() {
     let tbl = new TableUtils('users');
     tbl.addColumn('id')
         .addColumn('email')
         .create();
 };
 schemaDown() {};

 }; 