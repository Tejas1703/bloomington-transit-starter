import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTransit } from '../../context/TransitProvider';
import { metersToMiles } from '../../models/utils/geo';

export default function ProximityAlertCard({ alert }) {
  const { cancelAlert, getAlertStatus } = useTransit();
  const status = getAlertStatus(alert);

  if (alert.fired) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>📡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tracking {alert.routeName}</Text>
          <Text style={styles.subtitle}>
            Bus → {alert.stopName}
          </Text>
          {status && status.found && (
            <Text style={styles.distance}>
              Distance: {status.distanceMiles} mi | Alert at: {metersToMiles(alert.thresholdMeters)} mi
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => cancelAlert(alert.vehicleId)}>
          <Text style={styles.cancelBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* progress bar */}
      {status && status.found && (
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(100, status.progress * 100)}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 4,
    padding: 12,
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    zIndex: 10,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { fontSize: 20, marginRight: 8, marginTop: 2 },
  title: { color: '#60A5FA', fontWeight: '700', fontSize: 14 },
  subtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  distance: { color: '#D1D5DB', fontSize: 12, marginTop: 4 },
  cancelBtn: { color: '#6B7280', fontSize: 18, padding: 4 },
  progressBg: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
});
