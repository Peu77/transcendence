export const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);

create table if not exists users (
    id text primary key,
    email text unique not null,
    profilePictureId text unique,
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

create table if not exists friend_requests (
    id text primary key,
    senderId text not null references users(id) on delete cascade,
    receiverId text not null references users(id) on delete cascade,
    status text not null check(status in ('pending', 'accepted', 'rejected')) default 'pending',
    createdAt timestamp default current_timestamp not null,
    unique(senderId, receiverId)
);

create table if not exists friends (
    id text primary key,
    userId1 text not null references users(id) on delete cascade,
    userId2 text not null references users(id) on delete cascade,
    createdAt timestamp default current_timestamp not null,
    check(userId1 < userId2),
    unique(userId1, userId2)
);

create table if not exists conversations (
    id text primary key,
    type text not null check(type in ('direct', 'group')) default 'direct',
    createdAt timestamp default current_timestamp not null,
    updatedAt timestamp default current_timestamp not null
);

create table if not exists conversation_participants (
    conversationId text not null references conversations(id) on delete cascade,
    userId text not null references users(id) on delete cascade,
    joinedAt timestamp default current_timestamp not null,
    primary key (conversationId, userId)
);

create table if not exists messages (
    id text primary key,
    conversationId text not null references conversations(id) on delete cascade,
    senderId text not null references users(id) on delete cascade,
    content text not null,
    createdAt timestamp default current_timestamp not null
);
`;
