const axios = require('axios');
const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');
const config = require('../config');

// all the parsed gtfs data lives here
let routes = [];
let stops = [];
let stopTimes = {};    // keyed by tripId
let trips = {};        // keyed by tripId
let shapes = {};       // keyed by shapeId
let calendar = {};     // keyed by serviceId
let stopToRoutes = {}; // which routes serve each stop

async function loadGTFS() {
  // Implementation removed for public release.
  //
  // This function:
  // 1. Downloads the GTFS zip from the configured URL
  // 2. Parses routes.txt, stops.txt, trips.txt, stop_times.txt, shapes.txt, calendar.txt
  // 3. Builds in-memory data structures for fast lookups
  // 4. Creates a stop -> routes reverse mapping
  //
  // See GTFS spec: https://gtfs.org/schedule/reference/
  console.log('GTFS loading not implemented in public release');
}

function getActiveServiceIds() {
  // Implementation removed for public release.
  // Filters calendar data to find service IDs active on the current day.
  return [];
}

function getShapeForRoute(routeId) {
  // Implementation removed for public release.
  return [];
}

function getSchedule(routeId) {
  // Implementation removed for public release.
  // Builds today's schedule for a route by filtering trips by active service IDs,
  // resolving stop names, and sorting by departure time.
  return [];
}

module.exports = {
  loadGTFS,
  getRoutes: () => routes,
  getStops: (routeId) => {
    if (!routeId) return stops;
    return stops.filter(s => (stopToRoutes[s.stopId] || []).includes(routeId));
  },
  getShapeForRoute,
  getSchedule,
  getStopToRoutes: () => stopToRoutes,
  getAllTrips: () => trips,
  getAllStopTimes: () => stopTimes,
};
