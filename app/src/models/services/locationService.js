import * as Location from 'expo-location';

export async function getUserLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
  };
}
