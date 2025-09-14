export const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);

create table if not exists users (
    id text primary key,
    email text unique not null,
    password text not null,
    created_at timestamp current_timestamp not null
);
`