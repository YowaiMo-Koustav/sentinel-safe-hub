// Venue geospatial mock data — Aurora Grand Hotel (Singapore Marina Bay area for believable demo).
import type { LatLngTuple } from "leaflet";

export const VENUE_CENTER: LatLngTuple = [1.2843, 103.8607];
export const VENUE_ZOOM = 17;

export const ASSEMBLY_POINT: { coords: LatLngTuple; name: string } = {
  coords: [1.2849, 103.8615],
  name: "Marina Promenade · Assembly",
};

// Map of zone name (matching ZONES in incidents.ts) to lat/lng on the venue map.
export const ZONE_COORDS: Record<string, LatLngTuple> = {
  "Tower A · Lobby": [1.2841, 103.8602],
  "Tower A · Rooms": [1.2839, 103.8600],
  "Tower B · Lobby": [1.2845, 103.8612],
  "Tower B · Rooms": [1.2847, 103.8614],
  "Pool deck": [1.2846, 103.8606],
  "Conference hall": [1.2840, 103.8610],
  "Restaurant": [1.2843, 103.8604],
  "Parking": [1.2837, 103.8598],
  "Back of house": [1.2838, 103.8612],
};

export function zoneCoords(zone?: string | null): LatLngTuple {
  if (zone && ZONE_COORDS[zone]) return ZONE_COORDS[zone];
  return VENUE_CENTER;
}

// Build a believable polyline route between two zones via a midpoint waypoint.
export function buildRoute(fromZone?: string | null, toZone?: string | null): LatLngTuple[] {
  const from = zoneCoords(fromZone);
  const to = toZone && ZONE_COORDS[toZone] ? ZONE_COORDS[toZone] : ASSEMBLY_POINT.coords;
  const mid: LatLngTuple = [(from[0] + to[0]) / 2 + 0.0002, (from[1] + to[1]) / 2 - 0.0002];
  return [from, mid, to];
}
