import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { events, eventLocations, eventPricing, eventMedia } from "../db/schema.js";
// Side-effect import to apply module augmentation for request.user
import "../types/index.js";

// Validation schemas
const eventTypeSchema = z.enum(["class", "festival", "jam", "event"]);

const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  eventType: eventTypeSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  location: z.object({
    venueName: z.string().optional(),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  pricing: z
    .array(
      z.object({
        tierName: z.string().min(1),
        price: z.number().min(0),
        currency: z.string().length(3),
        registrationUrl: z.string().url().optional(),
        capacity: z.number().int().positive().optional(),
      })
    )
    .optional(),
  media: z
    .array(
      z.object({
        mediaType: z.enum(["image", "video"]),
        url: z.string().url(),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
});

const updateEventSchema = createEventSchema.partial();

const listEventsQuerySchema = z.object({
  type: eventTypeSchema.optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().default(50), // km
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function eventRoutes(fastify: FastifyInstance) {
  // List events with filters
  fastify.get("/events", async (request, reply) => {
    const queryResult = listEventsQuerySchema.safeParse(request.query);

    if (!queryResult.success) {
      return reply.status(400).send({
        error: "Invalid query parameters",
        details: queryResult.error.flatten().fieldErrors,
      });
    }

    const {
      type,
      city,
      country,
      startDate,
      endDate,
      lat,
      lng,
      radius,
      limit,
      offset,
    } = queryResult.data;

    // Build base query with relations
    let baseQuery = db.query.events.findMany({
      with: {
        organizer: {
          columns: { id: true, name: true, avatarUrl: true },
        },
        location: true,
        pricing: true,
        media: true,
      },
      where: and(
        type ? eq(events.eventType, type) : undefined,
        startDate ? gte(events.startDate, new Date(startDate)) : undefined,
        endDate ? lte(events.startDate, new Date(endDate)) : undefined
      ),
      limit,
      offset,
      orderBy: (events, { asc }) => [asc(events.startDate)],
    });

    let results = await baseQuery;

    // Filter by location if coordinates provided
    if (lat !== undefined && lng !== undefined) {
      // Haversine distance calculation in memory
      // For production, use PostGIS or database-level calculation
      results = results.filter((event) => {
        if (!event.location) return false;

        const eventLat = parseFloat(event.location.latitude);
        const eventLng = parseFloat(event.location.longitude);

        const distance = haversineDistance(lat, lng, eventLat, eventLng);
        return distance <= radius;
      });
    }

    // Filter by city/country
    if (city || country) {
      results = results.filter((event) => {
        if (!event.location) return false;
        if (city && event.location.city.toLowerCase() !== city.toLowerCase())
          return false;
        if (
          country &&
          event.location.country.toLowerCase() !== country.toLowerCase()
        )
          return false;
        return true;
      });
    }

    return reply.send({
      events: results,
      pagination: {
        limit,
        offset,
        total: results.length,
      },
    });
  });

  // Get single event
  fastify.get("/events/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    // Validate UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({ error: "Invalid event ID format" });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        organizer: {
          columns: { id: true, name: true, avatarUrl: true },
        },
        location: true,
        pricing: true,
        media: true,
        eventTeachers: {
          with: {
            teacher: true,
          },
        },
      },
    });

    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    return reply.send({ event });
  });

  // Create event (requires auth)
  fastify.post(
    "/events",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = createEventSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        });
      }

      const { location, pricing, media, ...eventData } = result.data;

      // Create event in a transaction
      const newEvent = await db.transaction(async (tx) => {
        // Insert event
        const [event] = await tx
          .insert(events)
          .values({
            ...eventData,
            startDate: new Date(eventData.startDate),
            endDate: eventData.endDate ? new Date(eventData.endDate) : null,
            organizerId: request.user!.id,
          })
          .returning();

        // Insert location
        await tx.insert(eventLocations).values({
          eventId: event.id,
          ...location,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        });

        // Insert pricing tiers if provided
        if (pricing && pricing.length > 0) {
          await tx.insert(eventPricing).values(
            pricing.map((p) => ({
              eventId: event.id,
              tierName: p.tierName,
              price: p.price.toString(),
              currency: p.currency,
              registrationUrl: p.registrationUrl,
              capacity: p.capacity,
            }))
          );
        }

        // Insert media if provided
        if (media && media.length > 0) {
          await tx.insert(eventMedia).values(
            media.map((m) => ({
              eventId: event.id,
              ...m,
            }))
          );
        }

        return event;
      });

      // Fetch the complete event with relations
      const completeEvent = await db.query.events.findFirst({
        where: eq(events.id, newEvent.id),
        with: {
          organizer: {
            columns: { id: true, name: true, avatarUrl: true },
          },
          location: true,
          pricing: true,
          media: true,
        },
      });

      return reply.status(201).send({ event: completeEvent });
    }
  );

  // Update event (requires auth, owner only)
  fastify.put(
    "/events/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Validate UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return reply.status(400).send({ error: "Invalid event ID format" });
      }

      // Check if event exists and user is owner
      const existingEvent = await db.query.events.findFirst({
        where: eq(events.id, id),
      });

      if (!existingEvent) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (existingEvent.organizerId !== request.user!.id) {
        return reply.status(403).send({ error: "Not authorized to update this event" });
      }

      const result = updateEventSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        });
      }

      const { location, pricing, media, ...eventData } = result.data;

      // Update event in a transaction
      await db.transaction(async (tx) => {
        // Update event
        if (Object.keys(eventData).length > 0) {
          const updateData: Record<string, unknown> = { ...eventData };
          if (eventData.startDate) {
            updateData.startDate = new Date(eventData.startDate);
          }
          if (eventData.endDate) {
            updateData.endDate = new Date(eventData.endDate);
          }
          updateData.updatedAt = new Date();

          await tx.update(events).set(updateData).where(eq(events.id, id));
        }

        // Update location if provided
        if (location) {
          await tx
            .update(eventLocations)
            .set({
              ...location,
              latitude: location.latitude.toString(),
              longitude: location.longitude.toString(),
            })
            .where(eq(eventLocations.eventId, id));
        }

        // Replace pricing if provided
        if (pricing) {
          await tx.delete(eventPricing).where(eq(eventPricing.eventId, id));
          if (pricing.length > 0) {
            await tx.insert(eventPricing).values(
              pricing.map((p) => ({
                eventId: id,
                tierName: p.tierName,
                price: p.price.toString(),
                currency: p.currency,
                registrationUrl: p.registrationUrl,
                capacity: p.capacity,
              }))
            );
          }
        }

        // Replace media if provided
        if (media) {
          await tx.delete(eventMedia).where(eq(eventMedia.eventId, id));
          if (media.length > 0) {
            await tx.insert(eventMedia).values(
              media.map((m) => ({
                eventId: id,
                ...m,
              }))
            );
          }
        }
      });

      // Fetch updated event
      const updatedEvent = await db.query.events.findFirst({
        where: eq(events.id, id),
        with: {
          organizer: {
            columns: { id: true, name: true, avatarUrl: true },
          },
          location: true,
          pricing: true,
          media: true,
        },
      });

      return reply.send({ event: updatedEvent });
    }
  );

  // Delete event (requires auth, owner only)
  fastify.delete(
    "/events/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Validate UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return reply.status(400).send({ error: "Invalid event ID format" });
      }

      // Check if event exists and user is owner
      const existingEvent = await db.query.events.findFirst({
        where: eq(events.id, id),
      });

      if (!existingEvent) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (existingEvent.organizerId !== request.user!.id) {
        return reply.status(403).send({ error: "Not authorized to delete this event" });
      }

      // Delete event (cascades to related tables)
      await db.delete(events).where(eq(events.id, id));

      return reply.status(204).send();
    }
  );
}

// Haversine formula for calculating distance between two points
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
