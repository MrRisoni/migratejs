import TableUtils from '../TableUtils';
import Column from '../Column';

module.exports =
    class migration20180429_090140authors {


        constructor(db) {
            this.db = db;
        }

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
                        resolve({schemaUp: false})
                    });
            });

        };

        schemaDown() {
        };

    };
