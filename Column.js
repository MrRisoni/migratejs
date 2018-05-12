export default class Column {


    constructor(name, options)
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
        this.options = options;
        return this;
    }

    parseOptions()
    {
        console.log(this.options);
        this.options.forEach(opt => {
            console.log(opt);

            for (const [key, value] of Object.entries(opt)) {
                if (key == 'type') {
                    this.setType(value);
                }
                if (key == 'primary') {
                    this.setPrimary();
                }
                if (key == 'null') {
                    this.setIsNull(value);
                }
            }
        });
    }


    setIsNull(val)
    {
        this.isNull = val;
    }



    setUnsigned()
    {
        this.unSigned = true;
    }

    setPrimary()
    {
        this.isNull  = false;
        this.isPrimary = true;

    }

    setType(type)
    {
        this.type = type;
        if (this.type.indexOf('INT') > -1) {
            this.isNumeric = true;
        }
    }



    setCollation(encoding)
    {
        this.collation = encoding;
    }

    setLen(len) {
        this.len = len;
    }

    getSQL()
    {
        this.parseOptions();

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