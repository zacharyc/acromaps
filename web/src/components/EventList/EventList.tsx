import type { Event } from "../../types";
import { EventCard } from "../EventCard/EventCard";
import styles from "./EventList.module.css";

interface EventListProps {
  events: Event[];
  emptyMessage?: string;
  showCreateButton?: boolean;
  onCreateEvent?: () => void;
}

export function EventList({
  events,
  emptyMessage = "No events found.",
  showCreateButton = false,
  onCreateEvent,
}: EventListProps) {
  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyMessage}</p>
        {showCreateButton && onCreateEvent && (
          <button className="btn btn-primary" onClick={onCreateEvent}>
            Create Event
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
