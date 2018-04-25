const moment = require('moment');
const fs = require('fs');
import  migration20180422_083815authors from './migrations/migration20180422_083815authors';


console.log(moment().format('YYYYMMDD_hhmmss'));

const stamp = moment().format('YYYYMMDD_hhmmss');



if ( process.argv[2] == 'new') {
    // make migration file
    const className = 'migration' + stamp + process.argv[3];
    let strFile = " export default class  " + className + " { \n";
    strFile += "  schemaUp() {}; \n";
    strFile += "  schemaDown() {}; \n";
    strFile += " }; ";


    fs.writeFile("migrations/" + className + ".js", strFile, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

}
else if ( process.argv[2] == 'migrate')
{
    // read the most recent migration

    let mg = new migration20180422_083815authors();
    mg.schemaUp();
}