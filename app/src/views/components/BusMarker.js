import React from 'react';
import { Marker } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';

export default function BusMarker({ vehicle, routes, onPress }) {
  const route = routes.find(r => r.routeId === vehicle.routeId);
  const color = route ? route.routeColor : '#3B82F6';
  const label = route ? route.shortName : vehicle.vehicleId;

  return (
    <Marker
      coordinate={{ latitude: vehicle.lat, longitude: vehicle.lng }}
      onPress={onPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.marker, { backgroundColor: color }]}>
        <Text style={styles.label}>🚌</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    fontSize: 16,
  },
});
