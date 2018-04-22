export default class TableUtils
{


    constructor (name)
    {
        this.name = name;
        this.columns = [];
    }

    addColumn(col)
    {
      this.columns.push(col);
      return this;
    }

    create()
    {

    }
}