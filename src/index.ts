import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { config } from "./config.js";
import { authPlugin } from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { eventRoutes } from "./routes/events.js";
import { configRoutes } from "./routes/config.js";
import { geocodeRoutes } from "./routes/geocode.js";

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug",
    transport:
      config.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  },
});

async function buildApp() {
  // Register plugins
  await fastify.register(cors, {
    origin: config.FRONTEND_URL,
    credentials: true,
  });

  await fastify.register(sensible);
  await fastify.register(authPlugin);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(eventRoutes);
  await fastify.register(configRoutes);
  await fastify.register(geocodeRoutes);

  return fastify;
}

async function start() {
  try {
    await buildApp();

    await fastify.listen({
      port: config.PORT,
      host: "0.0.0.0",
    });

    console.log(`🚀 Server running at http://localhost:${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    await fastify.close();
    process.exit(0);
  });
});

start();
