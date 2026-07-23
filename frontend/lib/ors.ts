import Openrouteservice from 'openrouteservice-js';

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_KEY || '';

function getApiKey(): string {
  if (!ORS_KEY) {
    console.warn('NEXT_PUBLIC_ORS_KEY not set. Get a free key at https://openrouteservice.org');
  }
  return ORS_KEY;
}

export function createDirections() {
  return new Openrouteservice.Directions({ api_key: getApiKey() });
}

export function createGeocode() {
  return new Openrouteservice.Geocode({ api_key: getApiKey() });
}

export function createIsochrones() {
  return new Openrouteservice.Isochrones({ api_key: getApiKey() });
}

export function createMatrix() {
  return new Openrouteservice.Matrix({ api_key: getApiKey() });
}

export async function getRoute(
  coordinates: [number, number][],
  profile: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car',
) {
  const ors = createDirections();
  return ors.calculate({
    coordinates,
    profile,
    format: 'geojson',
    maneuvers: true,
    instructions: true,
  });
}

export async function geocode(text: string) {
  const ors = createGeocode();
  return ors.geocode({ text });
}

export async function reverseGeocode(lat: number, lng: number) {
  const ors = createGeocode();
  return ors.reverseGeocode({ point: { lat_lng: [lat, lng] } });
}
