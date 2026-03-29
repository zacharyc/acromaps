import { ALL_EVENT_TYPES, EVENT_TYPE_LABELS, type EventFilters, type EventType, type SortConfig } from "../../types";
import styles from "./EventFilter.module.css";

interface EventFilterProps {
  filters: EventFilters;
  onFilterChange: (filters: EventFilters) => void;
  variant?: "compact" | "full";
  sort?: SortConfig;
  onSortChange?: (sort: SortConfig) => void;
}

export function EventFilter({
  filters,
  onFilterChange,
  variant = "compact",
  sort,
  onSortChange,
}: EventFilterProps) {
  const toggleEventType = (type: EventType) => {
    const currentTypes = filters.eventTypes;
    let newTypes: EventType[];

    if (currentTypes.includes(type)) {
      // Don't allow deselecting all types
      if (currentTypes.length === 1) return;
      newTypes = currentTypes.filter((t) => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }

    onFilterChange({ ...filters, eventTypes: newTypes });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, location: e.target.value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      dateRange: { ...filters.dateRange, start: e.target.value || null },
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      dateRange: { ...filters.dateRange, end: e.target.value || null },
    });
  };

  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onSortChange && sort) {
      onSortChange({ ...sort, field: e.target.value as SortConfig["field"] });
    }
  };

  const handleSortDirectionChange = () => {
    if (onSortChange && sort) {
      onSortChange({
        ...sort,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    }
  };

  const selectAll = () => {
    onFilterChange({ ...filters, eventTypes: [...ALL_EVENT_TYPES] });
  };

  const clearFilters = () => {
    onFilterChange({
      eventTypes: [...ALL_EVENT_TYPES],
      dateRange: { start: null, end: null },
      location: "",
      searchQuery: "",
    });
  };

  if (variant === "compact") {
    return (
      <div className={styles.compact}>
        <span className={styles.label}>Show:</span>
        <div className={styles.typeToggles}>
          {ALL_EVENT_TYPES.map((type) => (
            <button
              key={type}
              className={`${styles.typeToggle} ${styles[`toggle${type.charAt(0).toUpperCase()}${type.slice(1)}`]} ${
                filters.eventTypes.includes(type) ? styles.active : ""
              }`}
              onClick={() => toggleEventType(type)}
            >
              {EVENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {filters.eventTypes.length < ALL_EVENT_TYPES.length && (
          <button className={styles.showAll} onClick={selectAll}>
            Show All
          </button>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={styles.full}>
      <div className={styles.row}>
        <div className={styles.searchField}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search events..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className={styles.locationField}>
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            placeholder="City or country..."
            value={filters.location}
            onChange={handleLocationChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.dateField}>
          <label htmlFor="startDate">From</label>
          <input
            id="startDate"
            type="date"
            value={filters.dateRange.start || ""}
            onChange={handleStartDateChange}
          />
        </div>
        <div className={styles.dateField}>
          <label htmlFor="endDate">To</label>
          <input
            id="endDate"
            type="date"
            value={filters.dateRange.end || ""}
            onChange={handleEndDateChange}
          />
        </div>
        {sort && onSortChange && (
          <div className={styles.sortField}>
            <label htmlFor="sort">Sort by</label>
            <div className={styles.sortControls}>
              <select id="sort" value={sort.field} onChange={handleSortFieldChange}>
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="location">Location</option>
              </select>
              <button
                className={styles.sortDirection}
                onClick={handleSortDirectionChange}
                title={sort.direction === "asc" ? "Ascending" : "Descending"}
              >
                {sort.direction === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.row}>
        <div className={styles.typeFilters}>
          <span className={styles.label}>Event Types:</span>
          <div className={styles.typeToggles}>
            {ALL_EVENT_TYPES.map((type) => (
              <button
                key={type}
                className={`${styles.typeToggle} ${styles[`toggle${type.charAt(0).toUpperCase()}${type.slice(1)}`]} ${
                  filters.eventTypes.includes(type) ? styles.active : ""
                }`}
                onClick={() => toggleEventType(type)}
              >
                {EVENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
        <button className={styles.clearBtn} onClick={clearFilters}>
          Clear Filters
        </button>
      </div>
    </div>
  );
}
