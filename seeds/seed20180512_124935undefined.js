import TableUtils from '../TableUtils';

module.exports =
    class seed20180512_124935undefined {


        constructor(db) {
            this.db = db;
        }

        dataFeed() {

            return new Promise((resolve, reject) => {
                let tbl = new TableUtils('undefined', this.db);
                create().then(res => {
                    console.log('Data Inserted Ok');
                    resolve({
                        dataFeeded: true
                    });
                }).catch(err => {
                    console.log('data Feed NOT OK ' + JSON.stringify(err));
                    reject({
                        dataFeeded: false
                    })
                });
            });
        };
    };