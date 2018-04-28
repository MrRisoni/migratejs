A ridiculous attempt
to make an migration tool

Example

Create table

```javascript
 schemaUp() {
        console.log('Executing schema up...');
        let tbl = new TableUtils('users',this.db);
        tbl.addColumn( new Column('email').setType('VARCHAR').setLen(255).isNotNull())
           .addColumn( new Column('id').setType('INT').setLen(11).setPrimary())
           .addIndex({ type: 'UNIQUE', columns :['email']})
           .create();
    };
```

Adding extra column

```javascript
  schemaUp() {

            let tbl = new TableUtils('users',this.db);
            tbl.addColumn( new Column('pass').setType('VARCHAR').setLen(600).isNotNull())
                .alter();

        };
```



Renaming column and adding column

```javascript
  schemaUp() {
           let tbl = new TableUtils('users',this.db);
           tbl.renameColumn( { from :'pass', to:'password'})
               .addColumn( new Column('us_surname').setType('VARCHAR').setLen(255).isNotNull())
               .alter();
        };
```

UNIQUE index on multiple columns


```javascript
  schemaUp() {
            let tbl = new TableUtils('book_genres',this.db);
            tbl.addColumn( new Column('id').setType('INT').setLen(11).setPrimary())
                .addColumn( new Column('book_id').setType('INT').setLen(56).isNotNull().setUnsigned())
                .addColumn( new Column('genre_id').setType('TINYINT').setLen(56).isNotNull().setUnsigned())
                .addIndex({ type: 'UNIQUE', columns :['book_id','genre_id']})
                .create();
        };
```


