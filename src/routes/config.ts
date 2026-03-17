import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export async function configRoutes(fastify: FastifyInstance) {
  // Public config endpoint for frontend
  fastify.get("/config", async (_request, reply) => {
    return reply.send({
      mapboxToken: config.MAPBOX_ACCESS_TOKEN || null,
    });
  });
}
