import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { config } from "../config.js";
import type { JWTPayload } from "../types/index.js";

export async function authPlugin(fastify: FastifyInstance) {
  // Register cookie plugin
  await fastify.register(fastifyCookie);

  // Register JWT plugin
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });

  // Decorator for authentication
  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Try to get token from Authorization header first, then cookie
        const authHeader = request.headers.authorization;
        let token: string | undefined;

        if (authHeader?.startsWith("Bearer ")) {
          token = authHeader.slice(7);
        } else {
          token = request.cookies.token;
        }

        if (!token) {
          return reply.status(401).send({ error: "Authentication required" });
        }

        const decoded = fastify.jwt.verify<JWTPayload>(token);
        request.user = decoded;
      } catch (err) {
        return reply.status(401).send({ error: "Invalid or expired token" });
      }
    }
  );

  // Optional authentication - doesn't fail if no token
  fastify.decorate(
    "optionalAuth",
    async function (request: FastifyRequest, _reply: FastifyReply) {
      try {
        const authHeader = request.headers.authorization;
        let token: string | undefined;

        if (authHeader?.startsWith("Bearer ")) {
          token = authHeader.slice(7);
        } else {
          token = request.cookies.token;
        }

        if (token) {
          const decoded = fastify.jwt.verify<JWTPayload>(token);
          request.user = decoded;
        }
      } catch {
        // Silently ignore invalid tokens for optional auth
      }
    }
  );
}

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    optionalAuth: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
