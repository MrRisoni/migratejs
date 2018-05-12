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

        return new Promise((resolve, reject ) => {
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
        return new Promise((resolve, reject) => {


            let columnsSQL = [];

            this.columns.forEach(col => {
                columnsSQL.push(col.getSQL());
            });


            this.createSQL = ' CREATE TABLE ' + this.name + ' ( ' + columnsSQL.join(',');
            this.columns.forEach(col => {
                if (col.isPrimary === true) {
                    this.createSQL += ' , PRIMARY KEY (' + col.name + ') ';

                }

            });

            this.createSQL += ' ) ';

            console.log(this.createSQL);


            let PromiseArray = [this.db.execute(this.createSQL)];


            // indices
            //  this.addIndices();
            this.indices.forEach(idx => {
                const idxName = idx.type + '_' + idx.columns.join('_');

                let indexSQL = ' CREATE ' + idx.type + ' INDEX ' + idxName.toLowerCase()
                    + ' ON ' + this.name + '(' + idx.columns.join(',') + ')';

                PromiseArray.push(this.db.execute(indexSQL))
            });

            console.log('Executing Promise Array');
            Promise.all(PromiseArray).then(values => {
                console.log(values);
                resolve({success: true});
            }).catch(err => {
                reject({success: false});
            });


        });

    }

    addIndices()
    {

        this.indices.forEach( idx => {
            const idxName = idx.type + '_' + idx.columns.join('_');

            let indexSQL = ' CREATE ' + idx.type +' INDEX ' + idxName.toLowerCase()
                + ' ON ' + this.name + '('+ idx.columns.join(',') +')';

            this.db.execute(indexSQL);

        });
    }


    insert(dataRows) {
        return new Promise((resolve, reject) => {

            console.log('insert data');
            let PromiseArray = [];

            dataRows.forEach(row => {
                console.log(row);
                let col_names = [];
                let values = [];
                //runGenericQuery

                for (const [key, value] of Object.entries(row)) {
                    col_names.push(key )
                    values.push("'" + value + "'")
                }

                let sql = " INSERT INTO `" + this.name + "`  (" + col_names.join(',') + ")  VALUES (" + values.join(',') + ") ";
                console.log(sql);
                PromiseArray.push(this.db.runGenericQuery(sql));


            });

            Promise.all(PromiseArray).then(values => {
                console.log(values);
                resolve({success: true});
            }).catch(err => {
                reject({success: false});
            });

        });
    }
}