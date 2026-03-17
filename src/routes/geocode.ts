import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { geocodeAddress, reverseGeocode } from "../services/geocoding.js";

const forwardGeocodeSchema = z.object({
  address: z.string().min(1),
});

const reverseGeocodeSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export async function geocodeRoutes(fastify: FastifyInstance) {
  // Forward geocode: address -> coordinates
  fastify.get("/geocode", async (request, reply) => {
    const result = forwardGeocodeSchema.safeParse(request.query);

    if (!result.success) {
      return reply.status(400).send({
        error: "Invalid query parameters",
        details: result.error.flatten().fieldErrors,
      });
    }

    const geocoded = await geocodeAddress(result.data.address);

    if (!geocoded) {
      return reply.status(404).send({ error: "Address not found" });
    }

    return reply.send(geocoded);
  });

  // Reverse geocode: coordinates -> address
  fastify.get("/geocode/reverse", async (request, reply) => {
    const result = reverseGeocodeSchema.safeParse(request.query);

    if (!result.success) {
      return reply.status(400).send({
        error: "Invalid query parameters",
        details: result.error.flatten().fieldErrors,
      });
    }

    const geocoded = await reverseGeocode(
      result.data.latitude,
      result.data.longitude
    );

    if (!geocoded) {
      return reply.status(404).send({ error: "Location not found" });
    }

    return reply.send(geocoded);
  });
}
