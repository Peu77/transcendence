import { buildServer } from './app';

async function main() {
  const app = await buildServer();

  const hello = await app.inject({ method: 'GET', url: '/hello' });
  console.log('/hello status:', hello.statusCode, 'payload:', hello.payload);

  const ping = await app.inject({ method: 'GET', url: '/db/ping' });
  console.log('/db/ping status:', ping.statusCode, 'payload:', ping.payload);

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

