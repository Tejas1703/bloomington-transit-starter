import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'favorite_routes';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  // load from storage on mount
  useEffect(() => {
    loadFaves();
  }, []);

  async function loadFaves() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {
      // first time, no data stored, thats fine
    }
  }

  async function toggleFavorite(routeId) {
    let updated;
    if (favorites.includes(routeId)) {
      updated = favorites.filter(id => id !== routeId);
    } else {
      updated = [...favorites, routeId];
    }
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function isFavorite(routeId) {
    return favorites.includes(routeId);
  }

  return { favorites, toggleFavorite, isFavorite };
}
