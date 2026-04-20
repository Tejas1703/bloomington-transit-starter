import { useState, useEffect } from 'react';
import { requestNotificationPermission, fireNotification } from '../services/notificationService';

export function useBusProximity(vehicles) {
  const [trackedAlerts, setTrackedAlerts] = useState([]);

  async function trackBus(vehicleId, routeId, routeName, stop, thresholdMeters) {
    // Implementation removed for public release.
    // Requests notification permission, then adds a proximity alert
    // that tracks a specific vehicle relative to a stop.
  }

  // Check distances on every vehicle update
  useEffect(() => {
    // Implementation removed for public release.
    // Iterates tracked alerts, computes haversine distance between
    // each tracked vehicle and its target stop, fires push notification
    // when within threshold.
  }, [vehicles]);

  function getAlertStatus(alert) {
    // Implementation removed for public release.
    return null;
  }

  function cancelAlert(vehicleId) {
    setTrackedAlerts(prev => prev.filter(a => a.vehicleId !== vehicleId));
  }

  function clearFired() {
    setTrackedAlerts(prev => prev.filter(a => !a.fired));
  }

  return { trackedAlerts, trackBus, cancelAlert, clearFired, getAlertStatus };
}
