import React from 'react';
import { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';

export default function StopMarker({ stop, onPress }) {
  return (
    <Marker
      coordinate={{ latitude: stop.lat, longitude: stop.lng }}
      onPress={onPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.dot} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    borderWidth: 1,
    borderColor: '#fff',
  },
});
