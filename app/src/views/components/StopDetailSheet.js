import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTransit } from '../../context/TransitProvider';
import { formatMinutesAway } from '../../models/utils/time';
import { haversine, metersToWalkingMins, metersToMiles } from '../../models/utils/geo';
import { getUserLocation } from '../../models/services/locationService';

const PROXIMITY_OPTIONS = [
  { label: '0.25 mi', meters: 402 },
  { label: '0.5 mi', meters: 805 },
  { label: '1 mi', meters: 1609 },
];

export default function StopDetailSheet({ stop, arrivals, loading, onDismiss }) {
  const { vehicles, trackBus, activeTimer, startTimer, cancelTimer } = useTransit();
  const [walkingMins, setWalkingMins] = useState(null);
  const [showProximityPicker, setShowProximityPicker] = useState(null);

  // calc walking time when sheet opens
  React.useEffect(() => {
    calcWalkingTime();
  }, []);

  async function calcWalkingTime() {
    try {
      const loc = await getUserLocation();
      const dist = haversine(loc.lat, loc.lng, stop.lat, stop.lng);
      setWalkingMins(metersToWalkingMins(dist));
    } catch {
      // no gps access, skip it
    }
  }

  function handleTrackBus(arrival, thresholdMeters) {
    // find the vehicle for this trip
    const bus = vehicles.find(v => v.tripId === arrival.tripId);
    if (bus) {
      trackBus(bus.vehicleId, arrival.routeId, arrival.routeName, stop, thresholdMeters);
    }
    setShowProximityPicker(null);
  }

  function handleTimeToLeave(arrival) {
    if (!walkingMins && walkingMins !== 0) return;
    const buffer = 1;
    const leaveIn = arrival.minutesAway - walkingMins - buffer;
    if (leaveIn > 0) {
      startTimer(stop.stopName, arrival.routeName, leaveIn);
    }
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{stop.stopName}</Text>
          {walkingMins !== null && (
            <Text style={styles.walkingTime}>🚶 {walkingMins} min walk</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* time to leave timer if active */}
      {activeTimer && (
        <View style={styles.timerCard}>
          <Text style={styles.timerText}>
            🏃 Leave in {Math.ceil(activeTimer.minutesLeft)} min for {activeTimer.routeName}
          </Text>
          <TouchableOpacity onPress={cancelTimer}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 20 }} />
      ) : arrivals && arrivals.arrivals && arrivals.arrivals.length > 0 ? (
        <FlatList
          data={arrivals.arrivals.slice(0, 8)}
          keyExtractor={(item, i) => `${item.tripId}-${i}`}
          renderItem={({ item }) => (
            <View style={styles.arrivalRow}>
              <View style={[styles.routeDot, { backgroundColor: item.routeColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeName}>{item.routeName}</Text>
                <Text style={styles.eta}>{formatMinutesAway(item.minutesAway)} away</Text>
              </View>
              <View style={styles.actionBtns}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleTimeToLeave(item)}
                >
                  <Text style={styles.actionIcon}>⏰</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowProximityPicker(
                    showProximityPicker === item.tripId ? null : item.tripId
                  )}
                >
                  <Text style={styles.actionIcon}>📡</Text>
                </TouchableOpacity>
              </View>

              {/* proximity distance picker */}
              {showProximityPicker === item.tripId && (
                <View style={styles.proximityPicker}>
                  <Text style={styles.pickerLabel}>Alert when bus is within:</Text>
                  <View style={styles.pickerRow}>
                    {PROXIMITY_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.label}
                        style={styles.pickerBtn}
                        onPress={() => handleTrackBus(item, opt.meters)}
                      >
                        <Text style={styles.pickerBtnText}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        />
      ) : (
        <Text style={styles.noArrivals}>No upcoming arrivals</Text>
      )}
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
    maxHeight: '60%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  title: { color: '#F3F4F6', fontSize: 17, fontWeight: '700' },
  walkingTime: { color: '#10B981', fontSize: 13, marginTop: 4 },
  closeBtn: { color: '#6B7280', fontSize: 20, padding: 4 },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  timerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelText: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
  arrivalRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3450',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  routeName: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  eta: { color: '#9CA3AF', fontSize: 13 },
  actionBtns: { flexDirection: 'row', gap: 6 },
  actionBtn: { padding: 6 },
  actionIcon: { fontSize: 18 },
  proximityPicker: {
    width: '100%',
    paddingTop: 8,
    paddingLeft: 20,
  },
  pickerLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  pickerRow: { flexDirection: 'row', gap: 8 },
  pickerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
  },
  pickerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  noArrivals: { color: '#6B7280', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
