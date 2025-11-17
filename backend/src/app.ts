import "reflect-metadata";
import Fastify from "fastify";
import sqlitePlugin from "./plugins/sqlite";
import registerUserRoutes from "./users/user.controller";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import { registerAuthGuard } from "./users/auth.guard";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fastifyMultipart } from "@fastify/multipart";
// import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { GameRoomManager, registerGameRoutes, registerGameWebSocket } from "./game";

export const app = Fastify({ logger: true });

export const gameRoomManager = new GameRoomManager();

export async function buildServer() {
  const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
  const envOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : undefined;

  await app.register(cors, {
    origin: envOrigins ?? defaultOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  await app.register(fastifyCookie);
  await app.register(sqlitePlugin);
  await app.register(websocket);

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "frontend", "public"),
    prefix: "/public/",
    wildcard: true,
  });

  registerAuthGuard();
  await registerUserRoutes();
  
  registerGameRoutes(app, gameRoomManager);
  registerGameWebSocket(app, gameRoomManager);

  app.get("/hello", async () => ({ message: "Hello World" }));

  app.get("/db/ping", async () => {
    const now = new Date().toISOString();
    app.db
      .prepare("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)")
      .run("ping", now);
    const row = app.db
      .prepare("SELECT value FROM kv WHERE key = ?")
      .get("ping") as { value: string } | undefined;
    return { ok: true, value: row?.value ?? null };
  });

  /*
  this is a simple websocket endpoint that echoes messages back to the client
  this is only an example, this code should be moved to a separate module
   */
  // app.get("/ws", { websocket: true }, (connection, req) => {
  //   const userId = (req as any).userId as string | undefined;
  //   if (!userId) {
  //     console.log("Unauthorized WS connection attempt");
  //     connection.close();
  //     return;
  //   }

  //   connection.on("message", (buffer: Buffer) => {
  //     console.log("WS message received:", buffer.toString());
  //     try {
  //       const text = buffer.toString();
  //       if (text === "ping") {
  //         connection.send("pong");
  //         return;
  //       }
  //       connection.send(
  //         JSON.stringify({ type: "echo", data: text, t: Date.now() }),
  //       );
  //     } catch (err) {
  //       req.log.error({ err }, "WS message handling error");
  //     }
  //   });

  //   connection.on("close", () => {
  //     req.log.info({ userId }, "WS connection closed");
  //   });
  // });

  return app;
}
