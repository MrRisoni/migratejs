export default class TableUtils
{


    constructor (name, db)
    {
        this.name = name;
        this.columns = [];
        this.createSQL = "";
        this.alterSQL = '';
        this.db =db;
        this.renames = [];
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

    renameColumn(colData)
    {
      this.renames.push(colData);
      return this;
    }

    alter()
    {
        this.alterSQL = 'ALTER TABLE ' + this.name;
        let columnsSQL = [];
        console.log(this.columns);

        this.columns.forEach( col => {
            columnsSQL.push ( ' ADD COLUMN ' + col.getSQL());
        });

        this.db.run(this.alterSQL + columnsSQL.join(','));

        // chain promises !!!
        this.getRenaming().then(result => {
            this.db.run(this.alterSQL + result.SQL.join(','));
        });

    }

    getRenaming()
    {
        let renameSQL = [];

        return new Promise((resolve,reject ) => {
            this.db.execute("SHOW COLUMNS FROM " + this.name).then(colsSchema => {
                colsSchema.forEach(colSchema => {
                    this.renames.forEach(colData => {
                        if (colData.from === colSchema.Field) {
                            renameSQL.push(' CHANGE ' + colData.from + ' ' + colData.to + ' ' + colSchema.Type );
                        }
                    });
                });
                resolve( { SQL: renameSQL});
            });
        });
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
        this.addIndices();

    }

    addIndices()
    {

        this.indices.forEach( idx => {
            const idxName = idx.type + '_' + idx.columns.join('_');

            let indexSQL = ' CREATE ' + idx.type +' INDEX ' + idxName.toLowerCase()
                + ' ON ' + this.name + '('+ idx.columns.join(',') +')';

            this.db.run(indexSQL);

        });
    }
}