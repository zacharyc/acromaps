// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

// Event types
export type EventType = "class" | "jam" | "festival" | "event";

export interface EventLocation {
  city: string;
  country: string;
  venueName?: string;
  latitude: string;
  longitude: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  location?: EventLocation;
}

// Map event (transformed for display)
export interface MapEvent {
  id: string;
  title: string;
  eventType: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

// API types
export interface ApiInfo {
  name: string;
  version: string;
  description: string;
}

// Filter types
export interface EventFilters {
  eventTypes: EventType[];
  dateRange: { start: string | null; end: string | null };
  location: string;
  searchQuery: string;
}

export interface SortConfig {
  field: "date" | "title" | "location";
  direction: "asc" | "desc";
}

// Constants
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  class: "Classes",
  jam: "Jams",
  festival: "Festivals",
  event: "Events",
};

export const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  class: "Learn from experienced teachers in structured classes",
  jam: "Practice with the community in open jam sessions",
  festival: "Multi-day gatherings celebrating acroyoga",
  event: "Workshops, performances, and special events",
};

export const ALL_EVENT_TYPES: EventType[] = ["class", "jam", "festival", "event"];
