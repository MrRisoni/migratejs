A ridiculous attempt
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

Multile primary keys

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

node app AddColumnsToUser email:string passwd:string

node app RenameColumnInusers passwd:hash_passwd
