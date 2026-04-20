import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTransit } from '../../context/TransitProvider';
import { planTrip, formatMinutes, formatRelativeTime } from '../../services/tripService';
import { fireNotification } from '../../services/notificationService';

export default function FavoritesScreen() {
  const { routes, stops, stopRouteMap, scheduleCache, savedTrips, removeSavedTrip, userLocation } = useTransit();
  const [refreshedTrips, setRefreshedTrips] = useState([]);

  // Re-render every 60s to keep countdowns fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh ETAs for saved trips
  useEffect(() => {
    if (!savedTrips || savedTrips.length === 0 || !stopRouteMap || Object.keys(scheduleCache).length === 0) {
      setRefreshedTrips([]);
      return;
    }

    const updated = savedTrips.map((saved) => {
      try {
        // Use the SAVED departure time context, not "now"
        // This preserves the user's intended departure time
        const results = planTrip({
          originLat: saved.originCoords.latitude,
          originLng: saved.originCoords.longitude,
          destLat: saved.destCoords.latitude,
          destLng: saved.destCoords.longitude,
          allStops: stops,
          routes,
          stopRouteMap,
          scheduleCache,
          departAfterMinutes: saved.departAfterMinutes || null,
        });
        return { ...saved, liveResults: results.slice(0, 2) };
      } catch {
        return { ...saved, liveResults: [] };
      }
    });
    setRefreshedTrips(updated);
  }, [savedTrips, stopRouteMap, scheduleCache]);

  function confirmRemove(idx) {
    Alert.alert('Remove Trip', 'Remove this saved commute?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSavedTrip(idx) },
    ]);
  }

  // Calculate "time to leave" — just use a simple buffer since we don't have verified GPS
  function getTimeToLeave(trip) {
    if (!trip.liveResults || trip.liveResults.length === 0) return null;
    const next = trip.liveResults[0];
    if (!next.legs || next.legs.length === 0) return null;
    const busDeparts = next.legs[0].departureMinutes;

    // Use a 5 minute buffer to account for walking to stop
    const buffer = 5;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const leaveAt = busDeparts - buffer;
    const minsUntilLeave = leaveAt - nowMin;
    return { leaveAt, minsUntilLeave, busDeparts, buffer };
  }

  // ── Push notification for urgent departures ──────────────────────────────
  const notifiedDepartures = useRef(new Set());

  useEffect(() => {
    if (!refreshedTrips || refreshedTrips.length === 0) return;
    refreshedTrips.forEach((trip, idx) => {
      const ttl = getTimeToLeave(trip);
      if (!ttl) return;
      // Fire once when ≤ 5 min
      const key = `${idx}-${ttl.busDeparts}`;
      if (ttl.minsUntilLeave > 0 && ttl.minsUntilLeave <= 5 && !notifiedDepartures.current.has(key)) {
        notifiedDepartures.current.add(key);
        const routeName = trip.liveResults?.[0]?.legs?.[0]?.routeName || 'your bus';
        fireNotification(
          '🏃 Time to Leave!',
          `Head out now — ${routeName} departs in ${Math.ceil(ttl.minsUntilLeave)} min from ${trip.liveResults[0].legs[0].fromStop}`
        );
      }
    });
  }, [refreshedTrips]);

  if (!savedTrips || savedTrips.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Saved Commutes</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>No saved commutes</Text>
          <Text style={styles.emptySubtitle}>
            Plan a trip in the Trip tab and tap "Save" to add your daily commute here.
            {'\n\n'}
            You'll get live ETAs and "Time to Leave" countdowns!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Commutes</Text>
      <FlatList
        data={refreshedTrips}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => {
          const ttl = getTimeToLeave(item);
          const nextBus = item.liveResults?.[0];

          return (
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardRoute}>
                  <Text style={styles.cardOrigin} numberOfLines={1}>{item.originText}</Text>
                  <Text style={styles.cardArrow}>→</Text>
                  <Text style={styles.cardDest} numberOfLines={1}>{item.destText}</Text>
                </View>
                <TouchableOpacity onPress={() => confirmRemove(index)}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Time to Leave - updated with walking context */}
              {ttl && ttl.minsUntilLeave > 0 && (
                <View style={[
                  styles.ttlBanner,
                  ttl.minsUntilLeave <= 10 && styles.ttlUrgent,
                ]}>
                  <Text style={styles.ttlIcon}>{ttl.minsUntilLeave <= 10 ? '🔴' : '🟢'}</Text>
                  <View style={styles.ttlContent}>
                    <Text style={styles.ttlText}>
                      {ttl.minsUntilLeave <= 5
                        ? `Leave NOW! (${ttl.minsUntilLeave} min)`
                        : `Leave in ${formatRelativeTime(ttl.minsUntilLeave)}`}
                    </Text>
                    <Text style={styles.ttlSub}>
                      Bus departs at {formatMinutes(ttl.busDeparts)}
                    </Text>
                    <Text style={styles.ttlDetail}>
                      ⏱️ {ttl.buffer} min buffer before departure
                    </Text>
                  </View>
                </View>
              )}

              {ttl && ttl.minsUntilLeave <= 0 && (
                <View style={styles.ttlBanner}>
                  <Text style={styles.ttlIcon}>⏰</Text>
                  <Text style={styles.ttlText}>Next bus has passed. Checking later buses...</Text>
                </View>
              )}

              {/* Next bus option */}
              {nextBus && nextBus.legs && (
                <View style={styles.nextBus}>
                  {nextBus.legs.map((leg, i) => (
                    <View key={i} style={styles.legRow}>
                      <View style={[styles.routeBadge, { backgroundColor: leg.routeColor }]}>
                        <Text style={styles.badgeText}>{leg.routeShortName}</Text>
                      </View>
                      <View style={styles.legInfo}>
                        <Text style={styles.legRoute}>{leg.fromStop} → {leg.toStop}</Text>
                        <Text style={styles.legTime}>
                          Departs {formatMinutes(leg.departureMinutes)} · {leg.rideMinutes} min ride
                        </Text>
                      </View>
                    </View>
                  ))}
                  <Text style={styles.totalTime}>
                    Ride: {nextBus.legs.reduce((sum, l) => sum + l.rideMinutes, 0)} min ({nextBus.type === 'direct' ? 'Direct' : '1 Transfer'})
                  </Text>
                </View>
              )}

              {!nextBus && (
                <Text style={styles.noBus}>No buses available right now</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1629' },
  title: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  emptySubtitle: { color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: {
    marginHorizontal: 16, marginBottom: 14, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardRoute: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardOrigin: { color: '#10B981', fontSize: 14, fontWeight: '600', flex: 1 },
  cardArrow: { color: '#6B7280', fontSize: 16, marginHorizontal: 8 },
  cardDest: { color: '#EF4444', fontSize: 14, fontWeight: '600', flex: 1 },
  removeBtn: { color: '#6B7280', fontSize: 18, padding: 4 },
  ttlBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 12,
    padding: 12, marginBottom: 12,
  },
  ttlUrgent: { backgroundColor: 'rgba(239,68,68,0.15)' },
  ttlIcon: { fontSize: 20, marginRight: 10, marginTop: 2 },
  ttlContent: { flex: 1 },
  ttlText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ttlSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  ttlDetail: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  nextBus: { marginTop: 4 },
  legRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routeBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    marginRight: 10, minWidth: 36, alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  legInfo: { flex: 1 },
  legRoute: { color: '#E5E7EB', fontSize: 13 },
  legTime: { color: '#60A5FA', fontSize: 12, marginTop: 2 },
  totalTime: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'right' },
  noBus: { color: '#6B7280', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
});
