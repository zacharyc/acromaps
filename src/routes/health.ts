import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

export async function healthRoutes(fastify: FastifyInstance) {
  // Root route
  fastify.get("/", async (_request, reply) => {
    return reply.send({
      name: "Acromaps API",
      version: "1.0.0",
      description: "API service for acroyoga event listings",
      endpoints: {
        health: "GET /health",
        auth: {
          register: "POST /auth/register",
          login: "POST /auth/login",
          me: "GET /auth/me",
          logout: "POST /auth/logout",
        },
        events: {
          list: "GET /events",
          get: "GET /events/:id",
          create: "POST /events",
          update: "PUT /events/:id",
          delete: "DELETE /events/:id",
        },
      },
    });
  });

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
