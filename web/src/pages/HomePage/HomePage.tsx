import { Link } from "react-router-dom";
import { EventMap } from "../../components/EventMap/EventMap";
import { EventFilter } from "../../components/EventFilter/EventFilter";
import { EventList } from "../../components/EventList/EventList";
import { useApp } from "../../contexts/AppContext";
import styles from "./HomePage.module.css";

export function HomePage() {
  const {
    filteredMapEvents,
    mapboxToken,
    events,
    mapFilters,
    setMapFilters,
    handleCreateEvent,
    apiStatus,
    apiInfo,
  } = useApp();

  // Show first 4 events for preview
  const previewEvents = events.slice(0, 4);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h2>Find Acroyoga Events Near You</h2>
          <p>
            Discover classes, jams, festivals, and events in your area.
            Connect with the global acroyoga community.
          </p>
          <div className={styles.heroActions}>
            <Link to="/events" className="btn btn-large btn-primary">
              Explore Events
            </Link>
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

      {/* Map Section */}
      <section className={styles.mapSection}>
        <div className={styles.filterBar}>
          <EventFilter
            filters={mapFilters}
            onFilterChange={setMapFilters}
            variant="compact"
          />
        </div>
        <div className={styles.map}>
          <EventMap events={filteredMapEvents} mapboxToken={mapboxToken} />
        </div>
      </section>

      {/* Events Preview Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Upcoming Events</h3>
          <Link to="/events" className={styles.viewAllLink}>
            View All Events →
          </Link>
        </div>
        <EventList
          events={previewEvents}
          emptyMessage="No events yet. Be the first to add one!"
          showCreateButton
          onCreateEvent={handleCreateEvent}
        />
      </section>
    </div>
  );
}
