import { EventFilter } from "../../components/EventFilter/EventFilter";
import { EventList } from "../../components/EventList/EventList";
import { EventTypeGrid } from "../../components/EventTypeGrid/EventTypeGrid";
import { useApp } from "../../contexts/AppContext";
import { useEventFilters } from "../../hooks/useEventFilters";
import styles from "./EventsPage.module.css";

export function EventsPage() {
  const { events, handleCreateEvent } = useApp();

  const { filters, setFilters, sort, setSort, filteredEvents } = useEventFilters(
    events,
    true // sync with URL
  );

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1>Events</h1>
        <p>Discover acroyoga classes, jams, festivals, and events worldwide.</p>
      </section>

      <section className={styles.filterSection}>
        <EventFilter
          filters={filters}
          onFilterChange={setFilters}
          variant="full"
          sort={sort}
          onSortChange={setSort}
        />
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <span className={styles.resultCount}>
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found
          </span>
        </div>
        <EventList
          events={filteredEvents}
          emptyMessage="No events match your filters. Try adjusting your search criteria."
          showCreateButton
          onCreateEvent={handleCreateEvent}
        />
      </section>

      <section className={styles.typeSection}>
        <h2>Explore by Type</h2>
        <EventTypeGrid />
      </section>
    </div>
  );
}
