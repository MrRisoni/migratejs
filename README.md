A funny attempt
to make an migration tool

Example

Create table

./node_modules/@babel/node/bin/babel-node.js app.js g model User --prefix=usr name:string email:string passwd:string

```
create_table: 1
prefix: usr
table_name: users
id:
  type: bigint
  unsigned: true
created_at: true
updated_at: true
columns:
  - title: name
    type: STRING
  - title: email
    type: STRING
  - title: passwd
    type: STRING

```

Multiple primary keys

```
create_table: 1
prefix: art
name: migration20200530_010955_articles
table_name: articles
id:
  type: bigint
  unsigned: true
created_at: true
updated_at: true
columns:
  - title: title
    type: STRING
  - title: langid
    type: INT
    primary:true
```


Adding columns


Renaming columns


Changing column definition
./node_modules/@babel/node/bin/babel-node.js app ChangeTypeIn_threads downvotes:int


```
change_column_type: 1
name: migration20200608_113119_ChangeTypeIn_threads
table_name: threads
columns:
  - title: downvotes
    to: int
```


Adding unique index


Adding index


Adding  foreign key


Drop index

Drop column

./node_modules/@babel/node/bin/babel-node.js app.js RemoveColumnsFromusers usr_ban
```
remove_columns: 1
name: migration20200608_114147_RemoveColumnsFromusers
table_name: users
columns:
  - usr_ban
```

Drop table

Rollback

Update db with migration from version control

node app AddColumnsToUser email:string passwd:string

node app RenameColumnInusers passwd:hash_passwd
