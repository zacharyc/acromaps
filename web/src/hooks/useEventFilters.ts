import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { Event, EventFilters, SortConfig, EventType } from "../types";
import { ALL_EVENT_TYPES } from "../types";

const DEFAULT_FILTERS: EventFilters = {
  eventTypes: [...ALL_EVENT_TYPES],
  dateRange: { start: null, end: null },
  location: "",
  searchQuery: "",
};

const DEFAULT_SORT: SortConfig = {
  field: "date",
  direction: "asc",
};

export function useEventFilters(events: Event[], syncWithUrl = false) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL if syncing
  const initialFilters = useMemo((): EventFilters => {
    if (!syncWithUrl) return DEFAULT_FILTERS;

    const typeParam = searchParams.get("type");
    const typesParam = searchParams.get("types");
    const searchParam = searchParams.get("q");
    const locationParam = searchParams.get("location");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    let eventTypes: EventType[] = [...ALL_EVENT_TYPES];
    if (typeParam && ALL_EVENT_TYPES.includes(typeParam as EventType)) {
      eventTypes = [typeParam as EventType];
    } else if (typesParam) {
      const types = typesParam.split(",").filter((t) => ALL_EVENT_TYPES.includes(t as EventType)) as EventType[];
      if (types.length > 0) {
        eventTypes = types;
      }
    }

    return {
      eventTypes,
      dateRange: {
        start: startParam || null,
        end: endParam || null,
      },
      location: locationParam || "",
      searchQuery: searchParam || "",
    };
  }, [searchParams, syncWithUrl]);

  const initialSort = useMemo((): SortConfig => {
    if (!syncWithUrl) return DEFAULT_SORT;

    const sortParam = searchParams.get("sort");
    const dirParam = searchParams.get("dir");

    return {
      field: (sortParam as SortConfig["field"]) || "date",
      direction: (dirParam as SortConfig["direction"]) || "asc",
    };
  }, [searchParams, syncWithUrl]);

  const [filters, setFiltersState] = useState<EventFilters>(initialFilters);
  const [sort, setSortState] = useState<SortConfig>(initialSort);

  // Update URL when filters change
  const setFilters = useCallback(
    (newFilters: EventFilters) => {
      setFiltersState(newFilters);

      if (syncWithUrl) {
        const params = new URLSearchParams();

        if (newFilters.eventTypes.length < ALL_EVENT_TYPES.length) {
          params.set("types", newFilters.eventTypes.join(","));
        }
        if (newFilters.searchQuery) {
          params.set("q", newFilters.searchQuery);
        }
        if (newFilters.location) {
          params.set("location", newFilters.location);
        }
        if (newFilters.dateRange.start) {
          params.set("start", newFilters.dateRange.start);
        }
        if (newFilters.dateRange.end) {
          params.set("end", newFilters.dateRange.end);
        }

        // Preserve sort params
        if (sort.field !== "date") {
          params.set("sort", sort.field);
        }
        if (sort.direction !== "asc") {
          params.set("dir", sort.direction);
        }

        setSearchParams(params, { replace: true });
      }
    },
    [syncWithUrl, setSearchParams, sort]
  );

  const setSort = useCallback(
    (newSort: SortConfig) => {
      setSortState(newSort);

      if (syncWithUrl) {
        const params = new URLSearchParams(searchParams);

        if (newSort.field !== "date") {
          params.set("sort", newSort.field);
        } else {
          params.delete("sort");
        }

        if (newSort.direction !== "asc") {
          params.set("dir", newSort.direction);
        } else {
          params.delete("dir");
        }

        setSearchParams(params, { replace: true });
      }
    },
    [syncWithUrl, searchParams, setSearchParams]
  );

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let result = events.filter((event) => {
      // Filter by event type
      if (!filters.eventTypes.includes(event.eventType)) {
        return false;
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDescription = event.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Filter by location
      if (filters.location) {
        const locationQuery = filters.location.toLowerCase();
        const matchesCity = event.location?.city?.toLowerCase().includes(locationQuery);
        const matchesCountry = event.location?.country?.toLowerCase().includes(locationQuery);
        const matchesVenue = event.location?.venueName?.toLowerCase().includes(locationQuery);
        if (!matchesCity && !matchesCountry && !matchesVenue) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange.start) {
        const eventDate = new Date(event.startDate);
        const startDate = new Date(filters.dateRange.start);
        if (eventDate < startDate) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const eventDate = new Date(event.startDate);
        const endDate = new Date(filters.dateRange.end);
        if (eventDate > endDate) {
          return false;
        }
      }

      return true;
    });

    // Sort events
    result.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case "date":
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "location":
          const locA = a.location?.city || "";
          const locB = b.location?.city || "";
          comparison = locA.localeCompare(locB);
          break;
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [events, filters, sort]);

  return {
    filters,
    setFilters,
    sort,
    setSort,
    filteredEvents,
  };
}
