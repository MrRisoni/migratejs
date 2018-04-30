A ridiculous attempt
to make an migration tool (Inspiration Laravel)

Example

Create table

```javascript
  schemaUp() {

            return new Promise((resolve, reject) => {

                let tbl = new TableUtils('authors', this.db);
                tbl.addColumn(new Column('id').setType('INT').setLen(11).setPrimary())
                    .addColumn(new Column('name').setType('VARCHAR').setLen(255).isNotNull())
                    .create().then(res => {
                        console.log('Shema Up Ok');
                        resolve({schemaUp: true});
                    }).catch(err => {
                        console.log('Shema Up NOT OK ' + JSON.stringify(err));
                        reject({schemaUp: false})
                    });
            });

        };
```


```javascript
Create table and add index

 schemaUp() {

            return new Promise((resolve, reject) => {
                let tbl = new TableUtils('publishers', this.db);

                tbl.addColumn(new Column('id').setType('INT').setLen(11).setPrimary())
                    .addColumn(new Column('title').setType('VARCHAR').setLen(255).isNotNull())
                    .addIndex({type: 'UNIQUE', columns: ['title']})
                    .create().then(res => {
                    console.log('Shema Up Ok');
                    resolve({schemaUp: true});
                }).catch(err => {
                    console.log('Shema Up NOT OK ' + JSON.stringify(err));
                    reject({schemaUp: false})
                });
            });
        };
```