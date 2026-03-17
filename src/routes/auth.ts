import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";
import oauthPlugin from "@fastify/oauth2";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { config } from "../config.js";
import type { JWTPayload } from "../types/index.js";
// Side-effect import to apply module augmentation
import "../types/index.js";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SALT_ROUNDS = 12;

// Helper to generate JWT token
function generateToken(fastify: FastifyInstance, user: JWTPayload): string {
  return fastify.jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    { expiresIn: "7d" }
  );
}

// Helper to set auth cookie
function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie("token", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  // Email/Password Registration
  fastify.post("/auth/register", async (request, reply) => {
    const result = registerSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }

    const { email, password, name } = result.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        emailVerified: false,
      })
      .returning();

    // Generate token
    const token = generateToken(fastify, {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    setAuthCookie(reply, token);

    return reply.status(201).send({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
      },
      token,
    });
  });

  // Email/Password Login
  fastify.post("/auth/login", async (request, reply) => {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }

    const { email, password } = result.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(fastify, {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    setAuthCookie(reply, token);

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  });

  // Get current user
  fastify.get(
    "/auth/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, request.user!.id),
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      });
    }
  );

  // Logout
  fastify.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.send({ success: true });
  });

  // Google OAuth (only register if credentials are provided)
  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: "googleOAuth2",
      scope: ["profile", "email"],
      credentials: {
        client: {
          id: config.GOOGLE_CLIENT_ID,
          secret: config.GOOGLE_CLIENT_SECRET,
        },
        auth: oauthPlugin.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: "/auth/google",
      callbackUri: `${config.FRONTEND_URL}/auth/google/callback`,
    });

    fastify.get("/auth/google/callback", async (request, reply) => {
      try {
        const { token } =
          await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
            request
          );

        // Fetch user info from Google
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${token.access_token}` },
          }
        );

        const googleUser = (await response.json()) as {
          id: string;
          email: string;
          name: string;
          picture?: string;
        };

        // Find or create user
        let user = await db.query.users.findFirst({
          where: or(
            eq(users.googleId, googleUser.id),
            eq(users.email, googleUser.email)
          ),
        });

        if (user) {
          // Update Google ID if not set
          if (!user.googleId) {
            [user] = await db
              .update(users)
              .set({ googleId: googleUser.id, emailVerified: true })
              .where(eq(users.id, user.id))
              .returning();
          }
        } else {
          // Create new user
          [user] = await db
            .insert(users)
            .values({
              email: googleUser.email,
              name: googleUser.name,
              avatarUrl: googleUser.picture,
              googleId: googleUser.id,
              emailVerified: true,
            })
            .returning();
        }

        const jwtToken = generateToken(fastify, {
          id: user.id,
          email: user.email,
          name: user.name,
        });

        setAuthCookie(reply, jwtToken);

        // Redirect to frontend
        return reply.redirect(`${config.FRONTEND_URL}?auth=success`);
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${config.FRONTEND_URL}?auth=error`);
      }
    });
  }

  // Facebook OAuth (only register if credentials are provided)
  if (config.FACEBOOK_CLIENT_ID && config.FACEBOOK_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: "facebookOAuth2",
      scope: ["email", "public_profile"],
      credentials: {
        client: {
          id: config.FACEBOOK_CLIENT_ID,
          secret: config.FACEBOOK_CLIENT_SECRET,
        },
        auth: oauthPlugin.FACEBOOK_CONFIGURATION,
      },
      startRedirectPath: "/auth/facebook",
      callbackUri: `${config.FRONTEND_URL}/auth/facebook/callback`,
    });

    fastify.get("/auth/facebook/callback", async (request, reply) => {
      try {
        const { token } =
          await fastify.facebookOAuth2.getAccessTokenFromAuthorizationCodeFlow(
            request
          );

        // Fetch user info from Facebook
        const response = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token.access_token}`
        );

        const fbUser = (await response.json()) as {
          id: string;
          email?: string;
          name: string;
          picture?: { data?: { url?: string } };
        };

        if (!fbUser.email) {
          return reply.redirect(`${config.FRONTEND_URL}?auth=error&reason=no_email`);
        }

        // Find or create user
        let user = await db.query.users.findFirst({
          where: or(
            eq(users.facebookId, fbUser.id),
            eq(users.email, fbUser.email)
          ),
        });

        if (user) {
          if (!user.facebookId) {
            [user] = await db
              .update(users)
              .set({ facebookId: fbUser.id, emailVerified: true })
              .where(eq(users.id, user.id))
              .returning();
          }
        } else {
          [user] = await db
            .insert(users)
            .values({
              email: fbUser.email,
              name: fbUser.name,
              avatarUrl: fbUser.picture?.data?.url,
              facebookId: fbUser.id,
              emailVerified: true,
            })
            .returning();
        }

        const jwtToken = generateToken(fastify, {
          id: user.id,
          email: user.email,
          name: user.name,
        });

        setAuthCookie(reply, jwtToken);

        return reply.redirect(`${config.FRONTEND_URL}?auth=success`);
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${config.FRONTEND_URL}?auth=error`);
      }
    });
  }

  // Apple OAuth (only register if credentials are provided)
  if (config.APPLE_CLIENT_ID && config.APPLE_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: "appleOAuth2",
      scope: ["name", "email"],
      credentials: {
        client: {
          id: config.APPLE_CLIENT_ID,
          secret: config.APPLE_CLIENT_SECRET,
        },
        auth: oauthPlugin.APPLE_CONFIGURATION,
      },
      startRedirectPath: "/auth/apple",
      callbackUri: `${config.FRONTEND_URL}/auth/apple/callback`,
    });

    fastify.get("/auth/apple/callback", async (request, reply) => {
      try {
        const { token } =
          await fastify.appleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
            request
          );

        // Apple returns user info in the id_token
        // For simplicity, we decode it (in production, verify the signature)
        const idToken = token.id_token as string;
        const payload = JSON.parse(
          Buffer.from(idToken.split(".")[1], "base64").toString()
        ) as { sub: string; email?: string };

        if (!payload.email) {
          return reply.redirect(`${config.FRONTEND_URL}?auth=error&reason=no_email`);
        }

        // Apple only sends name on first login, so we use email as fallback
        const name = payload.email.split("@")[0];

        // Find or create user
        let user = await db.query.users.findFirst({
          where: or(
            eq(users.appleId, payload.sub),
            eq(users.email, payload.email)
          ),
        });

        if (user) {
          if (!user.appleId) {
            [user] = await db
              .update(users)
              .set({ appleId: payload.sub, emailVerified: true })
              .where(eq(users.id, user.id))
              .returning();
          }
        } else {
          [user] = await db
            .insert(users)
            .values({
              email: payload.email,
              name,
              appleId: payload.sub,
              emailVerified: true,
            })
            .returning();
        }

        const jwtToken = generateToken(fastify, {
          id: user.id,
          email: user.email,
          name: user.name,
        });

        setAuthCookie(reply, jwtToken);

        return reply.redirect(`${config.FRONTEND_URL}?auth=success`);
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${config.FRONTEND_URL}?auth=error`);
      }
    });
  }
}

// Type augmentation for OAuth
declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow(
        request: FastifyRequest
      ): Promise<{ token: { access_token: string } }>;
    };
    facebookOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow(
        request: FastifyRequest
      ): Promise<{ token: { access_token: string } }>;
    };
    appleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow(
        request: FastifyRequest
      ): Promise<{ token: { access_token: string; id_token: string } }>;
    };
  }
}
