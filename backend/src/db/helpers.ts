import {app} from "../app";

export function run(sql: string, ...params: any[]) {
    return app.db.prepare(sql).run(...params);
}

export function get<T>(sql: string, ...params: any[]): T | undefined {
    return app.db.prepare(sql).get(...params) as T | undefined;
}

export function all<T>(sql: string, ...params: any[]): T[] {
    return app.db.prepare(sql).all(...params) as T[];
}
