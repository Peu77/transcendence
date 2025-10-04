import { app } from "../app";
import jwt from "jsonwebtoken";

export function registerAuthGuard() {
  app.addHook("onRequest", async (request, reply) => {
    if (request.url.startsWith("/auth/")) return;

    const token = request.cookies.token;
      try {
          const decoded = jwt.verify(token || "", process.env.JWT_SECRET || "");
          if (!decoded || typeof decoded === "string" || !decoded.userId)
              return reply.code(401).send({ error: "Unauthorized" });
          request.userId = decoded.userId;
      } catch (err) {
          return reply.code(401).send({ error: "Unauthorized" });
      }
  });
}
