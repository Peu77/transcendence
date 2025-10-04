import "reflect-metadata";
import Fastify from "fastify";
import sqlitePlugin from "./plugins/sqlite";
import registerUserRoutes from "./users/user.controller";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import { registerAuthGuard } from "./users/auth.guard";

export const app = Fastify({ logger: true });

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

  await app.register(fastifyCookie);
  await app.register(sqlitePlugin);

  registerAuthGuard();
  registerUserRoutes();

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

  return app;
}
