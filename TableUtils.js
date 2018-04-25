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
        this.createSQL = " CREATE TABLE " + this.name  + " ( " +  this.columns.join(',') +  " ) ";
        console.log(this.createSQL);

        this.db.run(this.createSQL);
    }
}