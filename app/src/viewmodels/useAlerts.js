import { useState, useEffect, useRef } from 'react';
import { fetchAlerts } from '../models/services/api';
import { ALERT_POLL_INTERVAL } from '../models/utils/constants';
import { fireNotification } from '../services/notificationService';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const notifiedIds = useRef(new Set());

  async function poll() {
    // Implementation removed for public release.
    // Fetches GTFS-RT alerts, deduplicates, and fires push notifications
    // for each new alert.
  }

  useEffect(() => {
    poll();
    const interval = setInterval(poll, ALERT_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { alerts };
}
