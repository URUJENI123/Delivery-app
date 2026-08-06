import { Request, Response, NextFunction } from 'express';
import { geocodeAddress, reverseGeocode, isWithinKigali, detectDistrict, KIGALI_BOUNDS } from '../lib/geocoding';
import { BadRequestError } from '../lib/errors';

/**
 * POST /geocode/resolve
 * Body: { address: string }
 * Returns coordinates for an address string, biased to Kigali.
 * Used by the frontend/mobile map when the user types a pickup or dropoff address.
 */
export async function resolve(req: Request, res: Response, next: NextFunction) {
  try {
    const { address } = req.body as { address: string };
    if (!address?.trim()) throw new BadRequestError('address is required');

    const result = await geocodeAddress(address.trim());
    if (!result) {
      return res.status(404).json({ error: 'Address not found in Kigali. Please try a more specific address.' });
    }
    if (!result.withinKigali) {
      return res.status(422).json({
        error: 'Address is outside the Kigali service area (Nyarugenge, Kicukiro, Gasabo).',
        result,
      });
    }

    res.json(result);
  } catch (err) { next(err); }
}

/**
 * POST /geocode/reverse
 * Body: { lat: number, lng: number }
 * Returns a human-readable address for coordinates dropped on the map.
 * Used when the user pins a location directly on the map.
 */
export async function reverse(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng } = req.body as { lat: number; lng: number };
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new BadRequestError('lat and lng must be numbers');
    }

    const withinKigali = isWithinKigali(lat, lng);
    if (!withinKigali) {
      return res.status(422).json({
        error: 'Coordinates are outside the Kigali service area (Nyarugenge, Kicukiro, Gasabo).',
        bounds: KIGALI_BOUNDS,
      });
    }

    const result = await reverseGeocode(lat, lng);
    if (!result) {
      // Still return the district even if Nominatim can't resolve the exact address
      return res.json({
        displayName:  `${detectDistrict(lat, lng)}, Kigali`,
        district:     detectDistrict(lat, lng),
        withinKigali: true,
      });
    }

    res.json(result);
  } catch (err) { next(err); }
}

/**
 * GET /geocode/bounds
 * Returns the Kigali service area bounding box and district centres.
 * Used by the map to restrict the search/pan area.
 */
export async function getBounds(_req: Request, res: Response) {
  res.json({
    bounds: KIGALI_BOUNDS,
    districts: {
      Nyarugenge: { lat: -1.9494, lng: 30.0605, label: 'Nyarugenge (City Centre)' },
      Gasabo:     { lat: -1.9217, lng: 30.0930, label: 'Gasabo (Kimironko/Remera area)' },
      Kicukiro:   { lat: -1.9864, lng: 30.0897, label: 'Kicukiro (Gikondo/Niboye area)' },
    },
    defaultCenter: { lat: -1.9494, lng: 30.0605 },
    defaultZoom:   13,
  });
}
