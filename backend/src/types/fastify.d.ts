import type Database from "better-sqlite3";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export {};
