import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Event, ApiInfo, EventFilters, MapEvent, EventType } from "../types";

interface AppContextValue {
  // API state
  apiStatus: "loading" | "connected" | "error";
  apiInfo: ApiInfo | null;

  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  handleLogout: () => Promise<void>;

  // Events state
  events: Event[];
  fetchEvents: () => Promise<void>;

  // Map events (transformed)
  mapEvents: MapEvent[];
  filteredMapEvents: MapEvent[];

  // Mapbox
  mapboxToken: string | null;

  // Modal state
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showCreateEventModal: boolean;
  setShowCreateEventModal: (show: boolean) => void;

  // Filter state (for map filtering)
  mapFilters: EventFilters;
  setMapFilters: (filters: EventFilters) => void;

  // Helper to handle create event (checks auth)
  handleCreateEvent: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_FILTERS: EventFilters = {
  eventTypes: ["class", "jam", "festival", "event"],
  dateRange: { start: null, end: null },
  location: "",
  searchQuery: "",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiStatus, setApiStatus] = useState<"loading" | "connected" | "error">(
    "loading"
  );
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [mapFilters, setMapFilters] = useState<EventFilters>(DEFAULT_FILTERS);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      // Silently fail
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  // Handle create event (checks auth)
  const handleCreateEvent = useCallback(() => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowCreateEventModal(true);
    }
  }, [user]);

  // Initialize on mount
  useEffect(() => {
    // Check API connection
    fetch("/api/")
      .then((res) => res.json())
      .then((data: ApiInfo) => {
        setApiInfo(data);
        setApiStatus("connected");
      })
      .catch(() => setApiStatus("error"));

    // Fetch config (mapbox token)
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setMapboxToken(data.mapboxToken))
      .catch(() => {});

    // Fetch events
    fetchEvents();

    // Check if user is already logged in
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, [fetchEvents]);

  // Transform events for the map
  const mapEvents: MapEvent[] = events
    .filter((e) => e.location?.latitude && e.location?.longitude)
    .map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      latitude: parseFloat(e.location!.latitude),
      longitude: parseFloat(e.location!.longitude),
      city: e.location!.city,
      country: e.location!.country,
    }));

  // Filter map events based on mapFilters
  const filteredMapEvents = mapEvents.filter((event) => {
    // Filter by event type
    if (!mapFilters.eventTypes.includes(event.eventType as EventType)) {
      return false;
    }
    return true;
  });

  const value: AppContextValue = {
    apiStatus,
    apiInfo,
    user,
    setUser,
    handleLogout,
    events,
    fetchEvents,
    mapEvents,
    filteredMapEvents,
    mapboxToken,
    showAuthModal,
    setShowAuthModal,
    showCreateEventModal,
    setShowCreateEventModal,
    mapFilters,
    setMapFilters,
    handleCreateEvent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
