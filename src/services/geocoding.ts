import MapboxClient from "@mapbox/mapbox-sdk";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { config } from "../config.js";

let geocodingClient: ReturnType<typeof MapboxGeocoding> | null = null;

function getGeocodingClient() {
  if (!config.MAPBOX_ACCESS_TOKEN) {
    return null;
  }

  if (!geocodingClient) {
    const baseClient = MapboxClient({ accessToken: config.MAPBOX_ACCESS_TOKEN });
    geocodingClient = MapboxGeocoding(baseClient);
  }

  return geocodingClient;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  venueName?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const client = getGeocodingClient();

  if (!client) {
    console.warn("Mapbox token not configured, skipping geocoding");
    return null;
  }

  try {
    const response = await client
      .forwardGeocode({
        query: address,
        limit: 1,
        types: ["address", "poi", "place"],
      })
      .send();

    const feature = response.body.features[0];

    if (!feature) {
      return null;
    }

    const [longitude, latitude] = feature.center;

    // Extract city and country from context
    let city = "";
    let country = "";

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith("place.")) {
          city = ctx.text;
        } else if (ctx.id.startsWith("country.")) {
          country = ctx.text;
        }
      }
    }

    // Fallback to place_name parsing if context doesn't have city/country
    if (!city || !country) {
      const parts = feature.place_name.split(", ");
      if (!country && parts.length > 0) {
        country = parts[parts.length - 1];
      }
      if (!city && parts.length > 1) {
        city = parts[parts.length - 2];
      }
    }

    return {
      latitude,
      longitude,
      address: feature.place_name,
      city,
      country,
      venueName: feature.text,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  const client = getGeocodingClient();

  if (!client) {
    console.warn("Mapbox token not configured, skipping reverse geocoding");
    return null;
  }

  try {
    const response = await client
      .reverseGeocode({
        query: [longitude, latitude] as unknown as string,
        limit: 1,
        types: ["address", "poi", "place"],
      })
      .send();

    const feature = response.body.features[0];

    if (!feature) {
      return null;
    }

    let city = "";
    let country = "";

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith("place.")) {
          city = ctx.text;
        } else if (ctx.id.startsWith("country.")) {
          country = ctx.text;
        }
      }
    }

    return {
      latitude,
      longitude,
      address: feature.place_name,
      city,
      country,
      venueName: feature.text,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
