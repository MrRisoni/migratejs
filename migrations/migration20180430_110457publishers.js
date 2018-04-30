import TableUtils from '../TableUtils';
import Column from '../Column';

module.exports =
    class migration20180430_110457publishers {


        constructor(db) {
            this.db = db;
        }

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

        schemaDown() {
        };
    };