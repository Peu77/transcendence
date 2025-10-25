import { buildServer } from "./app";
import { getEnv } from "./utils/env";

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
