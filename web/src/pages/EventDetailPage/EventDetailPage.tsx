import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import type { Event } from "../../types";
import { EVENT_TYPE_LABELS } from "../../types";
import styles from "./EventDetailPage.module.css";

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    fetch(`/api/events/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Event not found");
        }
        return res.json();
      })
      .then((data) => {
        setEvent(data.event || data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>Event Not Found</h2>
          <p>{error || "The event you're looking for doesn't exist."}</p>
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const eventUrl = `${window.location.origin}/events/${event.id}`;
  const eventDescription = event.description?.slice(0, 160) || `${EVENT_TYPE_LABELS[event.eventType]} event in ${event.location?.city || "your area"}`;

  const badgeClass = styles[`badge${event.eventType.charAt(0).toUpperCase()}${event.eventType.slice(1)}`];

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{event.title} - Acromaps</title>
        <meta property="og:title" content={`${event.title} - Acromaps`} />
        <meta property="og:description" content={eventDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={eventUrl} />
        <meta name="description" content={eventDescription} />
      </Helmet>

      <div className={styles.container}>
        <Link to="/events" className={styles.backLink}>
          ← Back to Events
        </Link>

        <article className={styles.event}>
          <header className={styles.header}>
            <span className={`${styles.badge} ${badgeClass}`}>
              {EVENT_TYPE_LABELS[event.eventType]}
            </span>
            <h1>{event.title}</h1>
          </header>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date</span>
              <span className={styles.detailValue}>
                {new Date(event.startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {event.endDate && event.endDate !== event.startDate && (
                  <>
                    {" - "}
                    {new Date(event.endDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </>
                )}
              </span>
            </div>

            {event.location && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Location</span>
                <span className={styles.detailValue}>
                  {event.location.venueName && (
                    <span className={styles.venue}>{event.location.venueName}</span>
                  )}
                  {event.location.city}, {event.location.country}
                </span>
              </div>
            )}
          </div>

          {event.description && (
            <div className={styles.description}>
              <h2>About this Event</h2>
              <p>{event.description}</p>
            </div>
          )}

          {event.location?.latitude && event.location?.longitude && (
            <div className={styles.mapLink}>
              <a
                href={`https://www.google.com/maps?q=${event.location.latitude},${event.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                View on Google Maps
              </a>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
