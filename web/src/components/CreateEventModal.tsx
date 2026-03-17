import { useState } from "react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  mapboxToken: string | null;
}

type EventType = "class" | "jam" | "festival" | "event";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "jam", label: "Jam" },
  { value: "festival", label: "Festival" },
  { value: "event", label: "Event" },
];

export function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
  mapboxToken,
}: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("class");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [address, setAddress] = useState("");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  if (!isOpen) return null;

  const handleGeocode = async () => {
    if (!address && !city) {
      setError("Enter an address or city to geocode");
      return;
    }

    setGeocoding(true);
    setError(null);

    try {
      const query = [address, city, country].filter(Boolean).join(", ");
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Could not find location");
      }

      const data = await response.json();
      setLatitude(data.latitude.toString());
      setLongitude(data.longitude.toString());
      if (!city && data.city) setCity(data.city);
      if (!country && data.country) setCountry(data.country);
      if (!address && data.address) setAddress(data.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Geocoding failed");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!latitude || !longitude) {
        throw new Error("Please geocode the address or enter coordinates");
      }

      const startDateTime = new Date(`${startDate}T${startTime || "00:00"}`);
      let endDateTime: Date | undefined;
      if (endDate) {
        endDateTime = new Date(`${endDate}T${endTime || "23:59"}`);
      }

      const eventData = {
        title,
        description,
        eventType,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime?.toISOString(),
        isRecurring,
        location: {
          venueName: venueName || undefined,
          address,
          city,
          country,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      onEventCreated();
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventType("class");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setAddress("");
    setVenueName("");
    setCity("");
    setCountry("");
    setLatitude("");
    setLongitude("");
    setIsRecurring(false);
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        <h2>Create Event</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="title">Event Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Weekly Acroyoga Jam"
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="eventType">Type *</label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                required
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Tell people about your event..."
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              This is a recurring event
            </label>
          </div>

          <h3 className="form-section-title">Location</h3>

          <div className="form-group">
            <label htmlFor="venueName">Venue Name</label>
            <input
              type="text"
              id="venueName"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g., Community Center, Park Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="City"
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="country">Country *</label>
              <input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                placeholder="Country"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="number"
                step="any"
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 37.7749"
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="number"
                step="any"
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -122.4194"
              />
            </div>
            <div className="form-group flex-1 geocode-btn-container">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGeocode}
                disabled={geocoding || !mapboxToken}
              >
                {geocoding ? "Finding..." : "Find Coordinates"}
              </button>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
