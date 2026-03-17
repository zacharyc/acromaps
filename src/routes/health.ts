import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_request, reply) => {
    try {
      // Ping database
      await db.execute(sql`SELECT 1`);

      return reply.send({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (error) {
      return reply.status(503).send({
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
