import * as Location from 'expo-location';

// TODO: Replace with your own Google Maps API key
const GOOGLE_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
const BLOOMINGTON_LAT = 39.1653;
const BLOOMINGTON_LNG = -86.5264;

/**
 * Google Places Autocomplete — suggests addresses as user types.
 * Requires Places API enabled on your Google Cloud project.
 */
export async function searchPlaces(query) {
  // Implementation removed for public release.
  // Uses Google Places Autocomplete API to return address suggestions
  // filtered to the Bloomington, IN area.
  return [];
}

/**
 * Get lat/lng for a Google Place ID
 */
export async function getPlaceCoords(placeId) {
  // Implementation removed for public release.
  // Uses Google Places Details API to resolve a placeId to coordinates.
  return null;
}

/**
 * Geocode a typed address to lat/lng using expo-location (native geocoder).
 */
export async function geocodeAddress(address) {
  try {
    const fullAddress = address.toLowerCase().includes('bloomington')
      ? address
      : `${address}, Bloomington, IN`;
    const results = await Location.geocodeAsync(fullAddress);
    if (results && results.length > 0) {
      return { latitude: results[0].latitude, longitude: results[0].longitude };
    }
    return null;
  } catch (err) {
    console.log('Geocode error:', err.message);
    return null;
  }
}

/**
 * Get the user's current location with timeout fallback
 */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { latitude: BLOOMINGTON_LAT, longitude: BLOOMINGTON_LNG };
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch (err) {
    return { latitude: BLOOMINGTON_LAT, longitude: BLOOMINGTON_LNG };
  }
}

/**
 * Reverse geocode lat/lng to an address string
 */
export async function reverseGeocode(lat, lng) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results && results.length > 0) {
      const r = results[0];
      return `${r.street || r.name || ''}, ${r.city || 'Bloomington'}`;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
