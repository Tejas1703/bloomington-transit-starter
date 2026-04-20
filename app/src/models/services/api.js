import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
});

// --- static data ---

export async function fetchRoutes() {
  const res = await api.get('/api/routes');
  return res.data;
}

export async function fetchStops(routeId) {
  const url = routeId ? `/api/stops?routeId=${routeId}` : '/api/stops';
  const res = await api.get(url);
  return res.data;
}

export async function fetchShapes(routeId) {
  const res = await api.get(`/api/shapes/${routeId}`);
  return res.data;
}

export async function fetchSchedule(routeId) {
  const res = await api.get(`/api/schedule/${routeId}`);
  return res.data;
}

// --- realtime data ---

export async function fetchVehicles() {
  const res = await api.get('/api/vehicles');
  return res.data;
}

export async function fetchArrivals(stopId) {
  const res = await api.get(`/api/arrivals/${stopId}`);
  return res.data;
}

export async function fetchAlerts() {
  const res = await api.get('/api/alerts');
  return res.data;
}

// --- computed ---

export async function fetchNearest(lat, lng) {
  const res = await api.get(`/api/nearest?lat=${lat}&lng=${lng}`);
  return res.data;
}
