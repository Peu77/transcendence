import fp from 'fastify-plugin';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';

export interface SqlitePluginOptions {
  databaseFile?: string;
}

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export default fp<SqlitePluginOptions>(async (fastify: FastifyInstance, opts) => {
  const file = opts.databaseFile || process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'app.db');
  ensureDirExists(path.dirname(file));

  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.prepare(
    'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ).run();

  fastify.decorate('db', db);

  fastify.addHook('onClose', (instance, done) => {
    try {
      db.close();
      done();
    } catch (err) {
      done(err as Error);
    }
  });
});

