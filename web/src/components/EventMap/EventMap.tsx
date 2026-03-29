import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./EventMap.module.css";

interface EventLocation {
  id: string;
  title: string;
  eventType: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

interface EventMapProps {
  events: EventLocation[];
  mapboxToken: string | null;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  class: "#8b5cf6",
  jam: "#22c55e",
  festival: "#f59e0b",
  event: "#3b82f6",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  class: "Class",
  jam: "Jam",
  festival: "Festival",
  event: "Event",
};

const EVENT_TYPE_BG: Record<string, string> = {
  class: "#ede9fe",
  jam: "#dcfce7",
  festival: "#fef3c7",
  event: "#dbeafe",
};

export function EventMap({ events, mapboxToken }: EventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-90, 40],
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 16,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Add markers when events change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll(".event-marker");
    existingMarkers.forEach((marker) => marker.remove());

    // Add new markers
    events.forEach((event) => {
      const el = document.createElement("div");
      el.className = "event-marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor =
        EVENT_TYPE_COLORS[event.eventType] || "#6366f1";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      const color = EVENT_TYPE_COLORS[event.eventType] || "#6366f1";
      const bgColor = EVENT_TYPE_BG[event.eventType] || "#e0e7ff";
      const label = EVENT_TYPE_LABELS[event.eventType] || "Event";

      const popup = new mapboxgl.Popup({
        offset: 25,
        className: "event-popup",
        maxWidth: "280px",
      }).setHTML(`
        <div class="event-popup-content">
          <span class="event-popup-badge" style="background: ${bgColor}; color: ${color};">
            ${label}
          </span>
          <h4 class="event-popup-title">${event.title}</h4>
          <p class="event-popup-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${event.city}, ${event.country}
          </p>
          <a href="/events/${event.id}" class="event-popup-link">
            View Details →
          </a>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([event.longitude, event.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Fit bounds if there are events
    if (events.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      events.forEach((event) => {
        bounds.extend([event.longitude, event.latitude]);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [events, mapLoaded]);

  if (!mapboxToken) {
    return (
      <div className={styles.mapPlaceholder}>
        <p>Map unavailable - Mapbox token not configured</p>
      </div>
    );
  }

  return <div ref={mapContainer} className={styles.eventMap} />;
}
