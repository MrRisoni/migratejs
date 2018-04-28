export default class TableUtils
{


    constructor (name, db)
    {
        this.name = name;
        this.columns = [];
        this.createSQL = "";
        this.db =db;

        this.indices = [];

    }

    addColumn(col)
    {
      this.columns.push(col);
      return this;
    }

    addIndex(idx)
    {
        this.indices.push(idx);
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
        this.db.run(this.createSQL);

        // indices

        this.indices.forEach( idx => {
            const idxName = idx.type + '_' + idx.columns.join('_');

            let indexSQL = ' CREATE ' + idx.type +' INDEX ' + idxName.toLowerCase()
                + ' ON ' + this.name + '('+ idx.columns.join(',') +')';

            this.db.run(indexSQL);

        });
    }
}