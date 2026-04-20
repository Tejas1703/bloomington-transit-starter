// TODO: Replace with your transit agency's GTFS feed URLs
const BASE_URL = 'https://YOUR_GTFS_FEED_BASE_URL';

module.exports = {
  PORT: process.env.PORT || 8080,

  // static feed - download once on startup
  GTFS_ZIP_URL: `${BASE_URL}/gtfs.zip`,

  // realtime feeds - poll these
  VEHICLE_POSITIONS_URL: `${BASE_URL}/position_updates.pb`,
  TRIP_UPDATES_URL: `${BASE_URL}/trip_updates.pb`,
  ALERTS_URL: `${BASE_URL}/alerts.pb`,

  // poll intervals (ms)
  VEHICLE_POLL_MS: 10000,   // 10 sec
  TRIP_POLL_MS: 10000,
  ALERTS_POLL_MS: 60000,    // 1 min
};
