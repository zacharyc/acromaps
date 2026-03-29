import { Link } from "react-router-dom";
import { ALL_EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_DESCRIPTIONS, type EventType } from "../../types";
import styles from "./EventTypeGrid.module.css";

interface EventTypeGridProps {
  onTypeClick?: (type: EventType) => void;
}

export function EventTypeGrid({ onTypeClick }: EventTypeGridProps) {
  const handleClick = (type: EventType) => {
    if (onTypeClick) {
      onTypeClick(type);
    }
  };

  return (
    <div className={styles.grid}>
      {ALL_EVENT_TYPES.map((type) => (
        <Link
          key={type}
          to={`/events?type=${type}`}
          className={`${styles.card} ${styles[`card${type.charAt(0).toUpperCase()}${type.slice(1)}`]}`}
          onClick={() => handleClick(type)}
        >
          <h4>{EVENT_TYPE_LABELS[type]}</h4>
          <p>{EVENT_TYPE_DESCRIPTIONS[type]}</p>
          <span className={styles.browseLink}>Browse {EVENT_TYPE_LABELS[type]}</span>
        </Link>
      ))}
    </div>
  );
}
