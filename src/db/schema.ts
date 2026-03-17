import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const eventTypeEnum = pgEnum("event_type", [
  "class",
  "festival",
  "jam",
  "event",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  facebookId: text("facebook_id").unique(),
  appleId: text("apple_id").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule"),
  organizerId: uuid("organizer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Event locations table
export const eventLocations = pgTable("event_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  venueName: text("venue_name"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
});

// Event pricing table
export const eventPricing = pgTable("event_pricing", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  tierName: text("tier_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  registrationUrl: text("registration_url"),
  capacity: integer("capacity"),
});

// Event media table
export const eventMedia = pgTable("event_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  mediaType: mediaTypeEnum("media_type").notNull(),
  url: text("url").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
});

// Teachers table
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  bio: text("bio"),
  website: text("website"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Event teachers junction table
export const eventTeachers = pgTable(
  "event_teachers",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    role: text("role"),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.teacherId] })]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  events: many(events),
  teacher: one(teachers, {
    fields: [users.id],
    references: [teachers.userId],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  location: one(eventLocations, {
    fields: [events.id],
    references: [eventLocations.eventId],
  }),
  pricing: many(eventPricing),
  media: many(eventMedia),
  eventTeachers: many(eventTeachers),
}));

export const eventLocationsRelations = relations(eventLocations, ({ one }) => ({
  event: one(events, {
    fields: [eventLocations.eventId],
    references: [events.id],
  }),
}));

export const eventPricingRelations = relations(eventPricing, ({ one }) => ({
  event: one(events, {
    fields: [eventPricing.eventId],
    references: [events.id],
  }),
}));

export const eventMediaRelations = relations(eventMedia, ({ one }) => ({
  event: one(events, {
    fields: [eventMedia.eventId],
    references: [events.id],
  }),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  eventTeachers: many(eventTeachers),
}));

export const eventTeachersRelations = relations(eventTeachers, ({ one }) => ({
  event: one(events, {
    fields: [eventTeachers.eventId],
    references: [events.id],
  }),
  teacher: one(teachers, {
    fields: [eventTeachers.teacherId],
    references: [teachers.id],
  }),
}));
