import { useState } from 'react';
import { fetchNearest } from '../models/services/api';
import { getUserLocation } from '../models/services/locationService';

export function useNearestBus() {
  const [nearestResult, setNearestResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [nearestError, setNearestError] = useState(null);

  async function findNearest() {
    setSearching(true);
    setNearestError(null);
    try {
      const loc = await getUserLocation();
      const data = await fetchNearest(loc.lat, loc.lng);
      setNearestResult({ ...data, userLat: loc.lat, userLng: loc.lng });
    } catch (err) {
      console.log('nearest bus failed:', err.message);
      setNearestError(err.message);
    }
    setSearching(false);
  }

  function clearNearest() {
    setNearestResult(null);
  }

  return { nearestResult, searching, nearestError, findNearest, clearNearest };
}
