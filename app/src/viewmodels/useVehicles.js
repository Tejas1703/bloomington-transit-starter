import { useState, useEffect, useRef } from 'react';
import { fetchVehicles } from '../models/services/api';
import { POLL_INTERVAL } from '../models/utils/constants';

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  async function poll() {
    try {
      const data = await fetchVehicles();
      setVehicles(data.vehicles || []);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      // don't crash - just keep showing old data
      console.log('vehicle poll failed:', err.message);
    }
  }

  useEffect(() => {
    poll(); // get data right away
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { vehicles, lastUpdated };
}
