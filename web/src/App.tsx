import { useEffect, useState } from "react";
import { Header } from "./components/Header/Header";
import { EventMap } from "./components/EventMap/EventMap";
import { AuthModal } from "./components/AuthModal/AuthModal";
import { CreateEventModal } from "./components/CreateEventModal/CreateEventModal";
import styles from "./App.module.css";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface EventLocation {
  city: string;
  country: string;
  venueName?: string;
  latitude: string;
  longitude: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: "class" | "festival" | "jam" | "event";
  startDate: string;
  location?: EventLocation;
}

interface ApiInfo {
  name: string;
  version: string;
  description: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  class: "Classes",
  jam: "Jams",
  festival: "Festivals",
  event: "Events",
};

const EVENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  class: "Learn from experienced teachers in structured classes",
  jam: "Practice with the community in open jam sessions",
  festival: "Multi-day gatherings celebrating acroyoga",
  event: "Workshops, performances, and special events",
};

const TYPE_CARD_STYLES: Record<string, string> = {
  class: styles.typeCardClass,
  jam: styles.typeCardJam,
  festival: styles.typeCardFestival,
  event: styles.typeCardEvent,
};

const BADGE_STYLES: Record<string, string> = {
  class: styles.badgeClass,
  jam: styles.badgeJam,
  festival: styles.badgeFestival,
  event: styles.badgeEvent,
};

function App() {
  const [apiStatus, setApiStatus] = useState<"loading" | "connected" | "error">(
    "loading",
  );
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

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
      .catch(() => { });

    // Fetch events
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => { });

    // Check if user is already logged in
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => setUser(data.user))
      .catch(() => { });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const fetchEvents = () => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => { });
  };

  const handleCreateEvent = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowCreateEventModal(true);
    }
  };

  // Transform events for the map
  const mapEvents = events
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

  return (
    <div className={styles.app}>
      <Header
        user={user}
        onLogout={handleLogout}
        onSignIn={() => setShowAuthModal(true)}
      />

      <main>
        <section className={styles.mapSection} id="map">
          <EventMap events={mapEvents} mapboxToken={mapboxToken} />
        </section>

        <section className={styles.section} id="events">
          <h3>Explore by Type</h3>
          <div className={styles.typeGrid}>
            {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className={TYPE_CARD_STYLES[type]}>
                <h4>{label}</h4>
                <p>{EVENT_TYPE_DESCRIPTIONS[type]}</p>
                <button className="btn btn-outline">Browse {label}</button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3>Upcoming Events</h3>
          {events.length > 0 ? (
            <div className={styles.eventsGrid}>
              {events.slice(0, 6).map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <span className={BADGE_STYLES[event.eventType]}>
                    {EVENT_TYPE_LABELS[event.eventType]}
                  </span>
                  <h4>{event.title}</h4>
                  <p className={styles.eventDate}>
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {event.location && (
                    <p className={styles.eventLocation}>
                      {event.location.venueName &&
                        `${event.location.venueName}, `}
                      {event.location.city}, {event.location.country}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noEvents}>
              <p>No events yet. Be the first to add one!</p>
              <button className="btn btn-primary" onClick={handleCreateEvent}>
                Create Event
              </button>
            </div>
          )}
        </section>

        <section className={`${styles.section} ${styles.about}`} id="about">
          <h3>About Acromaps</h3>
          <p>
            This incarnation of Acromaps is was created to replace an older
            version built by OG members of the acroyoga community. The goal of
            this site is to allow people to find acroyoga events around the
            world.
          </p>

          <p>
            One of the issues with the OG acromaps was that events got stale.
            The goal of this site is change that. There is a little bit of
            overhead, you have to have an account to create an event, but events
            will remain current because you will prompted to confirm the
            validity of your event on a schedule or it will be removed.
          </p>
        </section>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h2>Find Acroyoga Events Near You</h2>
            <p>
              Discover classes, jams, festivals, and events in your area.
              Connect with the global acroyoga community.
            </p>
            <div className={styles.heroActions}>
              <a href="#events" className="btn btn-large btn-primary">
                Explore Events
              </a>
              <button
                className="btn btn-large btn-secondary"
                onClick={handleCreateEvent}
              >
                List Your Event
              </button>
            </div>
            <div className={styles.apiStatus}>
              {apiStatus === "loading" && (
                <span className={styles.statusLoading}>Connecting to API...</span>
              )}
              {apiStatus === "connected" && (
                <span className={styles.statusConnected}>
                  API Connected: {apiInfo?.name} v{apiInfo?.version}
                </span>
              )}
              {apiStatus === "error" && (
                <span className={styles.statusError}>
                  API Offline - Start the server with `npm run dev`
                </span>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} Acromaps. Made with &#x2764;&#xfe0f;
          for the acroyoga community.
        </p>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => setUser(user)}
      />

      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={fetchEvents}
        mapboxToken={mapboxToken}
      />
    </div>
  );
}

export default App;
