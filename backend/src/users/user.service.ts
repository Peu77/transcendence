import {TwoFARow, UserRow} from "../db/types";
import jwt from "jsonwebtoken";
import {getEnv} from "../server";
import {get, run} from "../db/helpers";
import {v4 as uuid} from "uuid";


export function createUserToken(userId: string) {
    return jwt.sign({userId}, getEnv("JWT_SECRET"), {expiresIn: "10h"});
}

export function createUser(id: string, email: string, passwordHash: string) {
    return run('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', id, email, passwordHash);
}

export function getUserById(id: string): UserRow | undefined {
    return get<UserRow>('SELECT * FROM users WHERE id = ?', id);
}

export function findUserByEmail(email: string): UserRow | undefined {
    return get<UserRow>('SELECT * FROM users WHERE email = ?', email);
}

export function getTwoFAByUserId(userId: string): TwoFARow | undefined {
    return get<TwoFARow>('SELECT * FROM users_2fa WHERE userId = ?', userId);
}

export function create2FaSession(userId: string) {
    const twoFaId = uuid();
    const secret = uuid().replace(/-/g, '').slice(0, 20).toUpperCase();
    const twoFaSecret = Buffer.from(secret).toString('base64').replace(/=/g, '');
    const IN_FIVE_MINUTES = 5 * 60 * 1000;
    const expiredAt = new Date(Date.now() + IN_FIVE_MINUTES).toISOString();

    run('INSERT INTO users_2fa (id, userId, secret, expiredAt) VALUES (?, ?, ?, ?)', twoFaId, userId, twoFaSecret, expiredAt);
    return {twoFaId, twoFaSecret};
}

export function delete2FaSession(twoFaId: string) {
    return run('DELETE FROM users_2fa WHERE id = ?', twoFaId);
}

export function isValidTwoFaToken(twoFaSecret: string, twoFaId: string, userId: string, token: string) {
    const result = get<TwoFARow>('SELECT * FROM users_2fa WHERE id = ? AND userId = ? AND secret = ?', twoFaId, userId, twoFaSecret);
    if (!result) return false;

    const user = getUserById(userId);
    if (!user || !user.twoFaEnabled || !user.twoFaSecret || new Date(result.expiredAt) < new Date()) {
        delete2FaSession(twoFaId);
        return false;
    }

    const speakeasy = require('speakeasy');
    return speakeasy.totp.verify({
        secret: Buffer.from(user.twoFaSecret!, 'base64').toString('ascii'),
        encoding: 'ascii',
        token: token,
        window: 1
    });
}

