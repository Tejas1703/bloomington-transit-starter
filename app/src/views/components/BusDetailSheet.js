import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BusDetailSheet({ vehicle, routes, onDismiss }) {
  const route = routes.find(r => r.routeId === vehicle.routeId);

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: route?.routeColor || '#3B82F6' }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {route ? route.routeName : `Bus ${vehicle.vehicleId}`}
          </Text>
          <Text style={styles.subtitle}>Vehicle #{vehicle.vehicleId}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Speed</Text>
          <Text style={styles.infoValue}>
            {vehicle.speed > 0 ? `${Math.round(vehicle.speed * 3.6)} km/h` : 'Stopped'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Heading</Text>
          <Text style={styles.infoValue}>{Math.round(vehicle.bearing)}°</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Trip</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {vehicle.tripId || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a2340',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  title: { color: '#F3F4F6', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  closeBtn: { color: '#6B7280', fontSize: 20, padding: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: { alignItems: 'center', flex: 1 },
  infoLabel: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  infoValue: { color: '#E5E7EB', fontSize: 15, fontWeight: '600' },
});
