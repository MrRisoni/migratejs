export default class TableUtils
{


    constructor (name, db)
    {
        this.name = name;
        this.columns = [];
        this.createSQL = "";
        this.db =db;

    }

    addColumn(col)
    {
      this.columns.push(col);
      return this;
    }

    create()
    {
        let columnsSQL = [];

        console.log(this.columns);

        this.columns.forEach( col => {
                columnsSQL.push ( col.getSQL());
        });

        this.createSQL = ' CREATE TABLE ' + this.name  + ' ( ' +  columnsSQL.join(',') ;
        this.columns.forEach( col => {
           if (col.isPrimary === true) {
                this.createSQL +=  ' , PRIMARY KEY (' + col.name +') ';

           }

        });

        this.createSQL +=  ' ) ';
        console.log(this.createSQL);

        this.db.run(this.createSQL);
    }
}