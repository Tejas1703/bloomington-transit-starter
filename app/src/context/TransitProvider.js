import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStaticData } from '../viewmodels/useStaticData';
import { useVehicles } from '../viewmodels/useVehicles';
import { useAlerts } from '../viewmodels/useAlerts';
import { useBusProximity } from '../viewmodels/useBusProximity';
import { useTimeToLeave } from '../viewmodels/useTimeToLeave';
import { buildStopRouteMap } from '../services/tripService';
import { getCurrentLocation } from '../services/placesService';

const TransitContext = createContext(null);

export function TransitProvider({ children }) {
  const staticData = useStaticData();
  const vehicleData = useVehicles();
  const alertData = useAlerts();
  const proximityData = useBusProximity(vehicleData.vehicles);
  const timeToLeaveData = useTimeToLeave();

  // Schedule/routing data (loaded in background)
  const [stopRouteMap, setStopRouteMap] = useState({});
  const [scheduleCache, setScheduleCache] = useState({});
  const [routeDataReady, setRouteDataReady] = useState(false);

  // Saved trips (persisted)
  const [savedTrips, setSavedTrips] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Selected routes for map display (SPOT-like checkboxes)
  const [selectedRoutes, setSelectedRoutes] = useState([]);

  // User location
  const [userLocation, setUserLocation] = useState(null);

  // Request location on app startup
  useEffect(() => {
    getCurrentLocation().then(loc => {
      if (loc) {
        console.log('Got user location:', loc.latitude, loc.longitude);
        setUserLocation(loc);
      }
    }).catch(err => {
      console.log('Startup location request failed:', err.message);
    });
  }, []);

  // Load saved trips from storage
  useEffect(() => {
    AsyncStorage.getItem('savedTrips').then(data => {
      if (data) setSavedTrips(JSON.parse(data));
    }).catch(() => {});
    AsyncStorage.getItem('favorites').then(data => {
      if (data) setFavorites(JSON.parse(data));
    }).catch(() => {});
  }, []);

  // Build stop-route mapping once routes are loaded
  useEffect(() => {
    if (staticData.routes.length > 0 && !routeDataReady) {
      console.log('Building stop-route map for', staticData.routes.length, 'routes...');
      buildStopRouteMap(staticData.routes).then(({ stopRouteMap: srm, scheduleCache: sc }) => {
        setStopRouteMap(srm);
        setScheduleCache(sc);
        setRouteDataReady(true);
        console.log('Stop-route map ready:', Object.keys(srm).length, 'stops mapped');
      }).catch(err => {
        console.log('Failed to build stop-route map:', err.message);
      });
    }
  }, [staticData.routes, routeDataReady]);

  // Save trip
  const addFavoriteTrip = useCallback((trip) => {
    setSavedTrips(prev => {
      const updated = [...prev, trip];
      AsyncStorage.setItem('savedTrips', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // Remove saved trip
  const removeSavedTrip = useCallback((index) => {
    setSavedTrips(prev => {
      const updated = prev.filter((_, i) => i !== index);
      AsyncStorage.setItem('savedTrips', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // Toggle favorite route
  const toggleFavorite = useCallback((routeId) => {
    setFavorites(prev => {
      const updated = prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId];
      AsyncStorage.setItem('favorites', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // Toggle route selection for map display
  const toggleRouteSelection = useCallback((routeId) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  }, []);

  // Select/deselect all routes for map
  const selectAllRoutes = useCallback(() => {
    setSelectedRoutes(staticData.routes.map(r => r.routeId));
  }, [staticData.routes]);

  const deselectAllRoutes = useCallback(() => {
    setSelectedRoutes([]);
  }, []);

  const value = {
    ...staticData,
    ...vehicleData,
    ...alertData,
    ...proximityData,
    ...timeToLeaveData,
    stopRouteMap,
    scheduleCache,
    routeDataReady,
    savedTrips,
    addFavoriteTrip,
    removeSavedTrip,
    favorites,
    toggleFavorite,
    selectedRoutes,
    toggleRouteSelection,
    selectAllRoutes,
    deselectAllRoutes,
    userLocation,
    setUserLocation,
  };

  return (
    <TransitContext.Provider value={value}>
      {children}
    </TransitContext.Provider>
  );
}

export function useTransit() {
  const ctx = useContext(TransitContext);
  if (!ctx) throw new Error('useTransit must be used inside TransitProvider');
  return ctx;
}
