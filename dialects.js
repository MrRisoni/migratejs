export function createdAtPostgres(prefix) {
    return  prefix + "created_at timestamp";
}

export function createdAtMySql(prefix) {
    return "`" + prefix + "created_at` DATETIME";
}

export function updatedAtPostgres(prefix) {
    return  prefix + "updated_at timestamp";
}

export function updatedAtMySql(prefix) {
    return "`" + prefix + "updated_at` DATETIME";
}

export function updatedAt(db, prfx) {
    console.log('hey dialects js ')
    console.log(prfx,db);
    switch (db) {
        case 'postgres':
            return updatedAtPostgres(prfx);
            break;
        case 'mysql':
            return updatedAtMySql(prfx);
            break;
    }
}


export function createdAt(db, prfx) {
    console.log('hey dialects js ')
    console.log(prfx,db);
    switch (db) {
        case 'postgres':
            return createdAtPostgres(prfx);
            break;
        case 'mysql':
            return createdAtMySql(prfx);
            break;
    }
}