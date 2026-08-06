/**
 * Geocoding helpers for Kigali City (3 districts: Nyarugenge, Kicukiro, Gasabo)
 *
 * Uses OpenStreetMap Nominatim — free, no API key required.
 * For production consider a paid provider (Google Maps, Mapbox, HERE) for
 * better rate limits and Rwanda-specific accuracy.
 *
 * Nominatim usage policy: max 1 req/second, must set a descriptive User-Agent
 * identifying the app. Configure via NOMINATIM_BASE_URL / NOMINATIM_EMAIL /
 * NOMINATIM_USER_AGENT in backend/.env (see .env.example).
 */

const NOMINATIM_BASE = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

const APP_IDENTITY = 'DeliveryApp/1.0 (kigali-moto-delivery';
const CONTACT      = process.env.NOMINATIM_EMAIL ? `; contact: ${process.env.NOMINATIM_EMAIL}` : '';
const USER_AGENT   = process.env.NOMINATIM_USER_AGENT || `${APP_IDENTITY}${CONTACT})`;

// ─── Kigali bounding box ──────────────────────────────────────────────────────
// Covers all 3 districts (Nyarugenge · Kicukiro · Gasabo) with a small buffer.
// Any pickup or dropoff coordinate outside this box is rejected at creation time.
export const KIGALI_BOUNDS = {
  minLat: -2.0800,  // southernmost point (below Kicukiro)
  maxLat: -1.8200,  // northernmost point (above Gasabo north)
  minLng:  29.9200, // westernmost point  (Nyarugenge west edge)
  maxLng:  30.2000, // easternmost point  (Gasabo east edge)
};

// District centre points — used for display and rough district detection
export const DISTRICTS = {
  Nyarugenge: { lat: -1.9494, lng: 30.0605 },
  Gasabo:     { lat: -1.9217, lng: 30.0930 },
  Kicukiro:   { lat: -1.9864, lng: 30.0897 },
} as const;

export type KigaliDistrict = keyof typeof DISTRICTS;

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns true if the coordinate is within the Kigali bounding box.
 * Used to validate delivery pickup/dropoff before saving to DB.
 */
export function isWithinKigali(lat: number, lng: number): boolean {
  return (
    lat >= KIGALI_BOUNDS.minLat && lat <= KIGALI_BOUNDS.maxLat &&
    lng >= KIGALI_BOUNDS.minLng && lng <= KIGALI_BOUNDS.maxLng
  );
}

/**
 * Returns the closest district name for a given coordinate.
 * Uses simple Euclidean distance to the district centre point.
 */
export function detectDistrict(lat: number, lng: number): KigaliDistrict {
  let closest: KigaliDistrict = 'Nyarugenge';
  let minDist = Infinity;
  for (const [name, centre] of Object.entries(DISTRICTS)) {
    const d = Math.hypot(lat - centre.lat, lng - centre.lng);
    if (d < minDist) { minDist = d; closest = name as KigaliDistrict; }
  }
  return closest;
}

// ─── Geocoding (address → coordinates) ───────────────────────────────────────

export interface GeocodeResult {
  lat:         number;
  lng:         number;
  displayName: string;
  district:    KigaliDistrict;
  withinKigali: boolean;
}

/**
 * Forward geocode: address string → latitude/longitude
 * Biased to Kigali bounding box so "Kimironko" resolves to Kigali, not elsewhere.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q:              `${address}, Kigali, Rwanda`,
    format:         'json',
    limit:          '1',
    countrycodes:   'rw',
    viewbox:        `${KIGALI_BOUNDS.minLng},${KIGALI_BOUNDS.maxLat},${KIGALI_BOUNDS.maxLng},${KIGALI_BOUNDS.minLat}`,
    bounded:        '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json() as any[];
  if (!data.length) return null;

  const { lat: rawLat, lon: rawLng, display_name } = data[0];
  const lat = parseFloat(rawLat);
  const lng = parseFloat(rawLng);

  return {
    lat,
    lng,
    displayName:  display_name,
    district:     detectDistrict(lat, lng),
    withinKigali: isWithinKigali(lat, lng),
  };
}

// ─── Reverse geocoding (coordinates → address) ───────────────────────────────

export interface ReverseGeocodeResult {
  displayName:  string;
  road?:        string;
  suburb?:      string;
  district:     KigaliDistrict;
  withinKigali: boolean;
}

/**
 * Reverse geocode: latitude/longitude → human-readable address string
 * Used when a user drops a pin on the map.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const params = new URLSearchParams({
    lat:    String(lat),
    lon:    String(lng),
    format: 'json',
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) throw new Error(`Nominatim reverse error: ${res.status}`);
  const data = await res.json() as any;
  if (data.error) return null;

  return {
    displayName:  data.display_name,
    road:         data.address?.road,
    suburb:       data.address?.suburb ?? data.address?.neighbourhood,
    district:     detectDistrict(lat, lng),
    withinKigali: isWithinKigali(lat, lng),
  };
}
