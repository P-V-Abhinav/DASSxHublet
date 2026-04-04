/**
 * nearby-places.ts
 *
 * Queries the OpenStreetMap Overpass API to find the nearest points of interest
 * for a given lat/lon. Uses multi-strategy fallback queries to ensure results are
 * found even in smaller cities.
 *
 * POI categories:
 *   - Nearest airport (searched within 200 km via aerodrome tag)
 *   - Nearest bus station / major bus stop (within 30 km, with fallbacks)
 *   - Nearest railway / metro station (within 50 km, with fallbacks)
 *   - Nearest hospital (within 25 km, with fallbacks)
 */

import { haversineDistance } from './haversine';

export interface NearbyPlace {
    name: string;
    distanceKm: number;
    lat: number;
    lon: number;
    osmUrl: string;
    type?: string;
}

export interface NearbyPlaces {
    airport?: NearbyPlace;
    busStation?: NearbyPlace;
    trainStation?: NearbyPlace;
    hospital?: NearbyPlace;
    fetchedAt: string;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'Hublet-RealEstate/1.0 (contact@hublet.demo)';

interface OverpassElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

interface OverpassResponse {
    elements: OverpassElement[];
}

/**
 * Run one Overpass API query and return parsed response.
 */
async function runOverpassQuery(query: string): Promise<OverpassResponse | null> {
    try {
        const response = await fetch(OVERPASS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': USER_AGENT,
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: AbortSignal.timeout(25_000),
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error(`[NearbyPlaces] Overpass ${response.status}: ${text.slice(0, 200)}`);
            return null;
        }

        return (await response.json()) as OverpassResponse;
    } catch (err: any) {
        if (err?.name === 'TimeoutError') {
            console.error('[NearbyPlaces] Overpass timeout');
        } else {
            console.error('[NearbyPlaces] Overpass request failed:', err);
        }
        return null;
    }
}

/**
 * Find the nearest element from Overpass results to the reference point.
 * Prefers elements with actual names over generic refs.
 */
function findNearest(
    elements: OverpassElement[],
    refLat: number,
    refLon: number,
    category?: string,
): NearbyPlace | undefined {
    let best: NearbyPlace | undefined;
    let bestDist = Infinity;

    for (const el of elements) {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        if (elLat === undefined || elLon === undefined) continue;

        const name =
            el.tags?.['name:en'] ||
            el.tags?.name ||
            el.tags?.['official_name'] ||
            el.tags?.['old_name'] ||
            el.tags?.['iata'] ||
            el.tags?.ref ||
            'Unknown';

        const dist = haversineDistance(refLat, refLon, elLat, elLon);

        // Prefer named results: assign a small penalty to unknown names so a
        // slightly-farther named result wins over an unnamed one at the same dist.
        const effectiveDist = name === 'Unknown' ? dist + 0.5 : dist;

        if (effectiveDist < bestDist) {
            bestDist = effectiveDist;
            best = {
                name,
                distanceKm: Math.round(dist * 10) / 10,
                lat: elLat,
                lon: elLon,
                osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
                type: category,
            };
        }
    }

    return best;
}

/**
 * Build an Overpass QL union query for multiple filters at once.
 * Returns up to `limit` results with centre coordinates.
 */
function buildUnionQuery(lat: number, lon: number, radiusM: number, filters: string[], limit = 20): string {
    const parts = filters.flatMap(f => [
        `node${f}(around:${radiusM},${lat},${lon});`,
        `way${f}(around:${radiusM},${lat},${lon});`,
        `relation${f}(around:${radiusM},${lat},${lon});`,
    ]);
    return `[out:json][timeout:25];\n(\n  ${parts.join('\n  ')}\n);\nout center ${limit};`;
}

/**
 * Try multiple query strategies for one POI category.
 * Stops as soon as at least one result is returned.
 */
async function findNearestPOI(
    lat: number,
    lon: number,
    strategies: Array<{ radiusM: number; filters: string[]; limit?: number }>,
    category: string,
): Promise<NearbyPlace | undefined> {
    for (const strategy of strategies) {
        const query = buildUnionQuery(lat, lon, strategy.radiusM, strategy.filters, strategy.limit ?? 20);
        const data = await runOverpassQuery(query);
        if (data?.elements?.length) {
            const result = findNearest(data.elements, lat, lon, category);
            if (result) {
                console.log(`[NearbyPlaces] ${category}: ${result.name} @ ${result.distanceKm} km (radius ${strategy.radiusM / 1000} km)`);
                return result;
            }
        }
        // Small delay between fallback attempts
        await new Promise(r => setTimeout(r, 300));
    }
    console.warn(`[NearbyPlaces] ${category}: no result found for (${lat}, ${lon})`);
    return undefined;
}

/**
 * Fetch all nearby POIs for the given coordinates.
 * Makes 4 sequential POI lookups, each with multi-strategy fallback.
 * Total time: typically 4–12 seconds depending on Overpass load.
 */
export async function fetchNearbyPlaces(lat: number, lon: number): Promise<NearbyPlaces> {
    const result: NearbyPlaces = { fetchedAt: new Date().toISOString() };

    // ── 1. Airport ────────────────────────────────────────────────────────────
    result.airport = await findNearestPOI(lat, lon, [
        {
            radiusM: 80_000,
            filters: ['["aeroway"="aerodrome"]["name"]'],
        },
        {
            radiusM: 200_000,
            filters: ['["aeroway"="aerodrome"]'],
        },
    ], 'airport');

    await new Promise(r => setTimeout(r, 400));

    // ── 2. Bus Station / Stop ────────────────────────────────────────────────
    // Strategy: major bus_station first → bus_stop with name → any bus_stop → public_transport=stop_position
    result.busStation = await findNearestPOI(lat, lon, [
        {
            radiusM: 10_000,
            filters: ['["amenity"="bus_station"]["name"]'],
        },
        {
            radiusM: 30_000,
            filters: ['["amenity"="bus_station"]'],
        },
        {
            radiusM: 5_000,
            filters: ['["highway"="bus_stop"]["name"]', '["amenity"="bus_stop"]["name"]'],
        },
        {
            radiusM: 15_000,
            filters: ['["highway"="bus_stop"]', '["amenity"="bus_stop"]'],
        },
    ], 'bus');

    await new Promise(r => setTimeout(r, 400));

    // ── 3. Railway / Metro Station ───────────────────────────────────────────
    result.trainStation = await findNearestPOI(lat, lon, [
        {
            radiusM: 10_000,
            filters: ['["railway"="station"]["name"]'],
        },
        {
            radiusM: 50_000,
            filters: ['["railway"="station"]'],
        },
        {
            radiusM: 20_000,
            filters: ['["railway"="halt"]["name"]', '["railway"="tram_stop"]["name"]', '["station"="subway"]["name"]'],
        },
        {
            radiusM: 50_000,
            filters: ['["railway"~"station|halt|tram_stop"]', '["station"="subway"]'],
        },
    ], 'train');

    await new Promise(r => setTimeout(r, 400));

    // ── 4. Hospital ──────────────────────────────────────────────────────────
    result.hospital = await findNearestPOI(lat, lon, [
        {
            radiusM: 10_000,
            filters: ['["amenity"="hospital"]["name"]'],
        },
        {
            radiusM: 25_000,
            filters: ['["amenity"="hospital"]'],
        },
        {
            radiusM: 15_000,
            filters: ['["amenity"~"hospital|clinic"]["name"]'],
        },
    ], 'hospital');

    return result;
}
