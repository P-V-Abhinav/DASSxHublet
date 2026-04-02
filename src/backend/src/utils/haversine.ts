/**
 * Haversine distance calculator.
 * Computes the great-circle distance between two lat/lon points on Earth.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the distance in kilometers between two geographic points.
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
}

/**
 * Convert a distance in km to a location match score (0–100).
 * Used by the matcher to replace string-based location scoring.
 */
export function distanceToScore(distanceKm: number): number {
    if (distanceKm <= 2) return 100;
    if (distanceKm <= 5) return 85;
    if (distanceKm <= 10) return 70;
    if (distanceKm <= 20) return 50;
    if (distanceKm <= 40) return 30;
    return 15;
}
