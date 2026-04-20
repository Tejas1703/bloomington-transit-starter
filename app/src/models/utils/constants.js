// TODO: Replace with your deployed backend URL
const API_BASE = 'http://localhost:8080';

export const API_URL = API_BASE;
export const POLL_INTERVAL = 10000;  // 10 sec
export const ALERT_POLL_INTERVAL = 60000; // 1 min

// bloomington center-ish
export const DEFAULT_REGION = {
  latitude: 39.1653,
  longitude: -86.5264,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// walking speed in meters per minute (~5km/h)
export const WALKING_SPEED = 80;
