A ridiculous attempt
to make an migration tool 

Example

Create table


node app.js g model User --prefix=usr name:string email:string passwd:string

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
