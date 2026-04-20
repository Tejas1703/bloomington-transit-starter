import { useState, useEffect } from 'react';
import { fetchRoutes, fetchStops, fetchShapes } from '../models/services/api';

export function useStaticData() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [shapes, setShapes] = useState({}); // keyed by routeId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStaticData();
  }, []);

  async function loadStaticData() {
    try {
      setLoading(true);
      const routeData = await fetchRoutes();
      setRoutes(routeData);

      const stopData = await fetchStops();
      setStops(stopData);

      // fetch shapes for each route
      const shapeMap = {};
      // do this in parallel so it's faster
      const shapePromises = routeData.map(async (r) => {
        try {
          const shapeData = await fetchShapes(r.routeId);
          shapeMap[r.routeId] = shapeData.points || [];
        } catch (e) {
          // some routes might not have shapes, that's ok
          shapeMap[r.routeId] = [];
        }
      });
      await Promise.all(shapePromises);
      setShapes(shapeMap);

      setLoading(false);
      console.log(`loaded ${routeData.length} routes, ${stopData.length} stops`);
    } catch (err) {
      console.log('failed to load static data:', err.message);
      setError(err.message);
      setLoading(false);
    }
  }

  return { routes, stops, shapes, loading, error };
}
