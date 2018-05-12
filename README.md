A ridiculous attempt
to make an migration tool (Inspiration Laravel, Phinx)

Example

Create table

```javascript
 class migration20180430_110457publishers {


        constructor(db) {
            this.db = db;
        }

        schemaUp() {

            return new Promise((resolve, reject) => {
                let tbl = new TableUtils('publishers', this.db);

                tbl.addColumn(new Column('id', [{type: 'int'},
                    {sign: 'unsigned'},
                    {primary: true}]))
                    .addColumn(new Column('title', [{type: 'VARCHAR'},
                        {length: 45},
                        {isNull: false}]))
                    .addIndex({type: 'UNIQUE', columns: ['title']})
                    .create().then(res => {
                            console.log('Schema Up Ok');
                            resolve({schemaUp: true});
                    }).catch(err => {
                            console.log('Schema Up NOT OK ' + JSON.stringify(err));
                            reject({schemaUp: false})
                    });
            });
        };

        schemaDown() {
        };
    };
```