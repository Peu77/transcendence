export const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);

create table if not exists users (
    id text primary key,
    email text unique not null,
    profilePictureId text,
    password text not null,
    twoFaEnabled integer default 0 not null,
    twoFaSecret text,
    createdAt timestamp default current_timestamp not null
);

create table if not exists users_2fa (
    id text primary key,
    userId text not null references users(id) on delete cascade,
    secret text not null,
    createdAt timestamp default current_timestamp not null,
    expiredAt timestamp not null    
);
`;
