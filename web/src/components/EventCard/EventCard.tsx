import { Link } from "react-router-dom";
import type { Event } from "../../types";
import { EVENT_TYPE_LABELS } from "../../types";
import styles from "./EventCard.module.css";

interface EventCardProps {
  event: Event;
  showLink?: boolean;
}

export function EventCard({ event, showLink = true }: EventCardProps) {
  const badgeClass = styles[`badge${event.eventType.charAt(0).toUpperCase()}${event.eventType.slice(1)}`];

  const content = (
    <>
      <span className={`${styles.badge} ${badgeClass}`}>
        {EVENT_TYPE_LABELS[event.eventType]}
      </span>
      <h4 className={styles.title}>{event.title}</h4>
      <p className={styles.date}>
        {new Date(event.startDate).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </p>
      {event.location && (
        <p className={styles.location}>
          {event.location.venueName && `${event.location.venueName}, `}
          {event.location.city}, {event.location.country}
        </p>
      )}
    </>
  );

  if (showLink) {
    return (
      <Link to={`/events/${event.id}`} className={styles.card}>
        {content}
      </Link>
    );
  }

  return <div className={styles.card}>{content}</div>;
}
