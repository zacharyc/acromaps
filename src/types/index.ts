import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  events,
  eventLocations,
  eventPricing,
  eventMedia,
  teachers,
  eventTeachers,
} from "../db/schema.js";

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Event types
export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

// Event location types
export type EventLocation = InferSelectModel<typeof eventLocations>;
export type NewEventLocation = InferInsertModel<typeof eventLocations>;

// Event pricing types
export type EventPricing = InferSelectModel<typeof eventPricing>;
export type NewEventPricing = InferInsertModel<typeof eventPricing>;

// Event media types
export type EventMedia = InferSelectModel<typeof eventMedia>;
export type NewEventMedia = InferInsertModel<typeof eventMedia>;

// Teacher types
export type Teacher = InferSelectModel<typeof teachers>;
export type NewTeacher = InferInsertModel<typeof teachers>;

// Event teacher types
export type EventTeacher = InferSelectModel<typeof eventTeachers>;
export type NewEventTeacher = InferInsertModel<typeof eventTeachers>;

// Event with relations
export type EventWithRelations = Event & {
  organizer: User;
  location: EventLocation | null;
  pricing: EventPricing[];
  media: EventMedia[];
};

// JWT payload
export interface JWTPayload {
  id: string;
  email: string;
  name: string;
}

// Augment @fastify/jwt module to use our JWTPayload
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
