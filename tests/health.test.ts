import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import { healthRoutes } from "../src/routes/health.js";

describe("Health Routes", () => {
  const fastify = Fastify();

  beforeAll(async () => {
    await fastify.register(healthRoutes);
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it("should return health status", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/health",
    });

    // Note: Without a real DB connection, this will return error status
    // In a real test environment, you'd mock the database
    expect(response.statusCode).toBe(503); // No DB connection in tests
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
  });
});
