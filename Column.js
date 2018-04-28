export default class Column {


    constructor(name)
    {
        this.name = name;
        this.type = '';
        this.len = 255;
        this.collation = 'utf8_general_ci';
        this.index = '';
        this.isPrimary = false;
        this.isNull = true;
        this.unSigned = false;
        this.isNumeric = false;
        return this;
    }

    isNotNull()
    {
        this.isNull = false;
        return this;

    }



    setUnsigned()
    {
        this.unSigned = true;
        return this;

    }
    setPrimary()
    {
        this.isNull  = false;
        this.isPrimary = true;
        if (this.isNumeric) {
            this.unSigned = true;
        }
        return this;
    }

    setType(type)
    {
        this.type = type;
        if (this.type.indexOf('INT') > -1) {
            this.isNumeric = true;
        }
        return this;
    }



    setCollation(encoding)
    {
        this.collation = encoding;
        return this;
    }

    setLen(len) {
        this.len = len;
        return this;
    }

    getSQL()
    {
        let  sql = this.name + ' ' + this.type + '(' + this.len+ ')';

        if (this.type === 'VARCHAR') {
            sql += ' COLLATE  ' + this.collation;
        }

        if (this.isNumeric === true && this.unSigned === true ) {
            sql += ' UNSIGNED';
        }

        if (this.isNull === false ) {
            sql += ' NOT NULL';
        }



        return sql;
    }


}