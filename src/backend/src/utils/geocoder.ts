/**
 * Nominatim-based geocoder utility for OpenStreetMap integration.
 * Supports forward geocoding (address → coords) and reverse geocoding (coords → address).
 * Respects Nominatim's 1 request/second usage policy.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'Hublet-RealEstate/1.0';

export interface GeocoderResult {
    lat: number;
    lon: number;
    displayName: string;
    locality: string; // suburb / city_district / city
    address?: string;
}

interface NominatimSearchResult {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        suburb?: string;
        city_district?: string;
        neighbourhood?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
    };
}

/**
 * Forward geocode: query string → coordinates + structured address
 */
export async function forwardGeocode(query: string): Promise<GeocoderResult | null> {
    try {
        const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=in`;
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
        });

        if (!response.ok) return null;

        const results = (await response.json()) as NominatimSearchResult[];
        if (results.length === 0) return null;

        const result = results[0];
        const addr = result.address;
        const locality = addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.city || addr?.town || addr?.village || '';

        return {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            displayName: result.display_name,
            locality,
            address: result.display_name,
        };
    } catch (error) {
        console.error('[Geocoder] Forward geocode failed:', error);
        return null;
    }
}

/**
 * Reverse geocode: coordinates → structured address + locality
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocoderResult | null> {
    try {
        const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
        });

        if (!response.ok) return null;

        const result = (await response.json()) as NominatimSearchResult;
        const addr = result.address;
        const locality = addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.city || addr?.town || addr?.village || '';

        return {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            displayName: result.display_name,
            locality,
            address: result.display_name,
        };
    } catch (error) {
        console.error('[Geocoder] Reverse geocode failed:', error);
        return null;
    }
}

/**
 * Geocode a locality name (best-effort, non-blocking).
 * Appends ", India" to bias results to India.
 */
export async function geocodeLocality(localityName: string): Promise<{ lat: number; lon: number } | null> {
    const result = await forwardGeocode(`${localityName}, India`);
    if (!result) return null;
    return { lat: result.lat, lon: result.lon };
}

/**
 * Geocode multiple localities with rate-limiting (1 req/sec).
 * Returns array of { name, lat, lon } for successfully geocoded localities.
 */
export async function geocodeLocalities(
    localities: string[]
): Promise<Array<{ name: string; lat: number; lon: number }>> {
    const results: Array<{ name: string; lat: number; lon: number }> = [];

    for (const loc of localities) {
        const coords = await geocodeLocality(loc);
        if (coords) {
            results.push({ name: loc, lat: coords.lat, lon: coords.lon });
        }
        // Rate limit: wait 1 second between requests
        if (localities.indexOf(loc) < localities.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1100));
        }
    }

    return results;
}
