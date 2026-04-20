const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const config = require('../config');

// cached data - gets updated by polling
let vehicles = [];
let tripUpdates = [];
let alerts = [];
let lastVehicleUpdate = null;

async function fetchVehicles() {
  // Implementation removed for public release.
  // Fetches GTFS-RT VehiclePositions protobuf, decodes it,
  // and maps entities to { vehicleId, routeId, lat, lng, bearing, speed, ... }
}

async function fetchTripUpdates() {
  // Implementation removed for public release.
  // Fetches GTFS-RT TripUpdates protobuf and extracts
  // stop-time predictions (arrival/departure delays and times).
}

async function fetchAlerts() {
  // Implementation removed for public release.
  // Fetches GTFS-RT Alerts protobuf and extracts
  // service alert text and affected route IDs.
}

function startPolling() {
  fetchVehicles();
  fetchTripUpdates();
  fetchAlerts();

  setInterval(fetchVehicles, config.VEHICLE_POLL_MS);
  setInterval(fetchTripUpdates, config.TRIP_POLL_MS);
  setInterval(fetchAlerts, config.ALERTS_POLL_MS);

  console.log('realtime polling started');
}

function getArrivalsForStop(stopId, gtfsStatic) {
  // Implementation removed for public release.
  // Matches trip updates to the given stop, computes minutes-away,
  // and returns sorted upcoming arrivals with route metadata.
  return [];
}

module.exports = {
  startPolling,
  getVehicles: () => ({ vehicles, lastUpdated: lastVehicleUpdate }),
  getTripUpdates: () => tripUpdates,
  getAlerts: () => alerts,
  getArrivalsForStop,
};
