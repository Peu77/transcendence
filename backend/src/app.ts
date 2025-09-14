import Fastify from 'fastify';
import sqlitePlugin from './plugins/sqlite';

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(sqlitePlugin);

  app.get('/hello', async () => ({ message: 'Hello World' }));

  app.get('/db/ping', async () => {
    const now = new Date().toISOString();
    app.db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)').run('ping', now);
    const row = app.db.prepare('SELECT value FROM kv WHERE key = ?').get('ping') as { value: string } | undefined;
    return { ok: true, value: row?.value ?? null };
  });

  return app;
}

