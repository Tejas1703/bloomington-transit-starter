import { fetchSchedule } from '../models/services/api';

/**
 * Build a mapping: stopId -> [routeId, routeId, ...]
 * by fetching schedules for all routes.
 */
export async function buildStopRouteMap(routes) {
  // Implementation removed for public release.
  // Fetches schedule data for each route and builds a reverse mapping
  // from stop IDs to the set of route IDs that serve each stop.
  // Returns { stopRouteMap, routeStopOrder, scheduleCache }
  return { stopRouteMap: {}, routeStopOrder: {}, scheduleCache: {} };
}

/**
 * Find the N nearest stops to a lat/lng
 */
export function findNearestStops(lat, lng, allStops, count = 5) {
  // Implementation removed for public release.
  // Uses haversine distance to sort stops by proximity.
  return [];
}

/**
 * Format minutes to "HH:MM AM/PM"
 */
export function formatMinutes(mins) {
  let h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format a duration in minutes as human-readable relative time.
 */
export function formatRelativeTime(totalMinutes) {
  if (totalMinutes <= 0) return 'now';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

/**
 * Format minutes-until-arrival into a relative time string.
 */
export function formatArrivalRelative(departureMinutes) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const diff = departureMinutes - nowMin;
  if (diff <= 0) return 'departing now';
  return `in ${formatRelativeTime(diff)}`;
}

/**
 * ====== MAIN TRIP PLANNER ======
 *
 * Given origin + destination coords, find bus trip options.
 * Returns array of trip options sorted by total time.
 *
 * Algorithm overview:
 * 1. Find nearest stops to origin and destination
 * 2. Identify routes serving both origin-stop and dest-stop (direct routes)
 * 3. For each common route, find the next connecting trip
 * 4. Try one-transfer routes through transit hub stops
 * 5. Sort by total travel time, deduplicate, return top results
 */
export function planTrip({
  originLat, originLng, destLat, destLng,
  allStops, routes, stopRouteMap, scheduleCache,
  departAfterMinutes = null,
}) {
  // Implementation removed for public release.
  // See algorithm overview in JSDoc above.
  return [];
}

/**
 * Get next arrivals at a specific stop across all routes
 */
export function getUpcomingArrivals(stopId, stopRouteMap, scheduleCache, routes, afterMin = null) {
  // Implementation removed for public release.
  return [];
}

/**
 * Get ALL upcoming departures at a stop on a specific route (next N buses).
 */
export function getAllUpcomingAtStop(scheduleCache, routeId, stopId, count = 3) {
  // Implementation removed for public release.
  return [];
}
