import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <strong style="font-size: 14px;">${event.title}</strong>
          <p style="margin: 4px 0 0; color: #666; font-size: 12px;">
            ${event.city}, ${event.country}
          </p>
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
      <div className="map-placeholder">
        <p>Map unavailable - Mapbox token not configured</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="event-map" />;
}
