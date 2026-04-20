import { useState } from 'react';
import { fetchArrivals } from '../models/services/api';

export function useArrivals() {
  const [arrivals, setArrivals] = useState(null);
  const [loadingArrivals, setLoadingArrivals] = useState(false);

  async function getArrivals(stopId) {
    setLoadingArrivals(true);
    try {
      const data = await fetchArrivals(stopId);
      setArrivals(data);
    } catch (err) {
      console.log('arrivals fetch failed:', err.message);
      setArrivals({ stopId, stopName: '', arrivals: [] });
    }
    setLoadingArrivals(false);
  }

  function clearArrivals() {
    setArrivals(null);
  }

  return { arrivals, loadingArrivals, getArrivals, clearArrivals };
}
