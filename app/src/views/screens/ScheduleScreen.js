import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Platform, StatusBar,
} from 'react-native';
import { useTransit } from '../../context/TransitProvider';
import { getAllUpcomingAtStop, formatRelativeTime, formatArrivalRelative } from '../../services/tripService';
import { fetchSchedule } from '../../models/services/api';
import { formatGtfsTime } from '../../models/utils/time';

export default function ScheduleScreen() {
  const {
    routes, vehicles, stops, stopRouteMap, scheduleCache, routeDataReady,
    selectedRoutes, toggleRouteSelection, selectAllRoutes, deselectAllRoutes,
  } = useTransit();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('routes'); // 'routes' | 'detail'

  // Re-render every 60s to keep relative times fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  function busCount(routeId) {
    return (vehicles || []).filter(v => v.routeId === routeId).length;
  }

  function getServiceStatus(routeId) {
    const count = busCount(routeId);
    if (count > 0) return { text: `${count} bus${count > 1 ? 'es' : ''} active`, color: '#10B981' };
    const sched = scheduleCache[routeId];
    if (sched && sched.trips && sched.trips.length > 0) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      for (const trip of sched.trips) {
        if (trip.stops && trip.stops.length > 0) {
          const firstDep = trip.stops[0].departure;
          const parts = firstDep.split(':');
          const depMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          if (depMin > nowMin) {
            const minsUntil = depMin - nowMin;
            return { text: `Next in ${formatRelativeTime(minsUntil)}`, color: '#FBBF24' };
          }
        }
      }
      return { text: 'Service ended today', color: '#6B7280' };
    }
    return { text: 'Schedule unavailable', color: '#6B7280' };
  }

  async function selectRoute(route) {
    setSelectedRoute(route);
    setViewMode('detail');
    setLoading(true);
    try {
      const data = await fetchSchedule(route.routeId);
      setSchedule(data);

      if (data && data.trips) {
        const stopMap = {};
        const stopOrder = [];
        data.trips.forEach(trip => {
          trip.stops.forEach(s => {
            if (!stopMap[s.stopId]) {
              stopMap[s.stopId] = s;
              stopOrder.push(s);
            }
          });
        });
        setRouteStops(stopOrder);
      }
    } catch (err) {
      console.log('Schedule failed:', err.message);
    }
    setLoading(false);
  }

  function goBackToRoutes() {
    setViewMode('routes');
    setSelectedRoute(null);
    setRouteStops([]);
    setSchedule(null);
  }

  // Get the next upcoming bus at a stop for the selected route
  function getUpcomingBuses(stopId) {
    if (!selectedRoute) return [];
    return getAllUpcomingAtStop(scheduleCache, selectedRoute.routeId, stopId, 1);
  }

  // Are all routes selected?
  const allSelected = selectedRoutes.length === routes.length && routes.length > 0;

  // Route list view
  if (viewMode === 'routes') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Routes & Buses</Text>
        <Text style={styles.subtitle}>
          Select routes to display on the map
        </Text>

        {/* Select All */}
        <TouchableOpacity
          style={styles.selectAllRow}
          onPress={() => allSelected ? deselectAllRoutes() : selectAllRoutes()}
        >
          <View style={[styles.checkbox, allSelected && styles.checkboxActive]}>
            {allSelected && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.selectAllText}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Text>
          <Text style={styles.selectedCount}>
            {selectedRoutes.length}/{routes.length} on map
          </Text>
        </TouchableOpacity>

        <FlatList
          data={routes}
          keyExtractor={r => r.routeId}
          renderItem={({ item }) => {
            const status = getServiceStatus(item.routeId);
            const isSelected = selectedRoutes.includes(item.routeId);
            return (
              <View style={styles.routeCard}>
                {/* Checkbox for map selection */}
                <TouchableOpacity
                  style={styles.checkboxArea}
                  onPress={() => toggleRouteSelection(item.routeId)}
                >
                  <View style={[
                    styles.checkbox,
                    isSelected && [styles.checkboxActive, { backgroundColor: item.routeColor }],
                  ]}>
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                {/* Route info - tappable for details */}
                <TouchableOpacity
                  style={styles.routeInfoArea}
                  onPress={() => selectRoute(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.routeNumber, { backgroundColor: item.routeColor }]}>
                    <Text style={styles.routeNumberText}>{item.shortName || item.routeId}</Text>
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeName} numberOfLines={1}>{item.routeName}</Text>
                    <Text style={[styles.routeStatus, { color: status.color }]}>{status.text}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    );
  }

  // Route detail view
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={goBackToRoutes}
        activeOpacity={0.6}
      >
        <Text style={styles.backText}>← All Routes</Text>
      </TouchableOpacity>

      {selectedRoute && (
        <View style={styles.routeHeader}>
          <View style={[styles.routeNumberLg, { backgroundColor: selectedRoute.routeColor }]}>
            <Text style={styles.routeNumberLgText}>{selectedRoute.shortName}</Text>
          </View>
          <View>
            <Text style={styles.routeHeaderName}>{selectedRoute.routeName}</Text>
            <Text style={[styles.routeStatus, { color: getServiceStatus(selectedRoute.routeId).color }]}>
              {getServiceStatus(selectedRoute.routeId).text}
            </Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.detailScroll}>
          <Text style={styles.sectionTitle}>Stops on this route</Text>

          {routeStops.map((stop, idx) => {
            const upcoming = getUpcomingBuses(stop.stopId);
            return (
              <View key={`${stop.stopId}-${idx}`} style={styles.stopCard}>
                <View style={styles.stopTimeline}>
                  <View style={[styles.stopDot, { backgroundColor: selectedRoute?.routeColor || '#3B82F6' }]} />
                  {idx < routeStops.length - 1 && (
                    <View style={[styles.stopLine, { backgroundColor: selectedRoute?.routeColor || '#3B82F6' }]} />
                  )}
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.stopName}</Text>

                  {upcoming.length > 0 ? (
                    upcoming.map((bus, bIdx) => (
                      <View key={bIdx} style={styles.busArrivalRow}>
                        <Text style={styles.busScheduleTime}>
                          {formatGtfsTime(bus.departureTime)}
                        </Text>
                        <Text style={[
                          styles.busArrivalTime,
                          bus.minutesUntil <= 10 && styles.busArrivalSoon,
                        ]}>
                          {formatArrivalRelative(bus.departureMinutes)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.stopNoService}>No more buses today</Text>
                  )}
                </View>
              </View>
            );
          })}

          {schedule && schedule.trips && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Today's Schedule</Text>
              {schedule.trips.slice(0, 10).map((trip, idx) => (
                <View key={idx} style={styles.tripMini}>
                  <View style={styles.tripMiniHeader}>
                    <Text style={styles.tripHeadsign}>{trip.headsign || `Trip ${idx + 1}`}</Text>
                  </View>
                  <Text style={styles.tripStopRange}>
                    {formatGtfsTime(trip.stops[0]?.departure)} → {formatGtfsTime(trip.stops[trip.stops.length - 1]?.departure)}
                  </Text>
                  <Text style={styles.tripStopCount}>{trip.stops.length} stops</Text>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1629' },
  title: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  subtitle: { color: '#6B7280', paddingHorizontal: 20, marginBottom: 8, fontSize: 13 },
  selectAllRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10, paddingVertical: 10,
    paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  selectAllText: { color: '#E5E7EB', fontSize: 15, fontWeight: '600', flex: 1 },
  selectedCount: { color: '#60A5FA', fontSize: 12, fontWeight: '500' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: '#4B5563',
    marginRight: 14, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    borderColor: '#3B82F6', backgroundColor: '#3B82F6',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  checkboxArea: {
    paddingVertical: 14, paddingLeft: 14, paddingRight: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  routeInfoArea: {
    flexDirection: 'row', alignItems: 'center', flex: 1,
    paddingVertical: 12, paddingRight: 14,
  },
  routeInfo: { flex: 1 },
  routeNumber: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    marginRight: 10, minWidth: 32, alignItems: 'center',
  },
  routeNumberText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  routeName: { color: '#E5E7EB', fontSize: 14, fontWeight: '500' },
  routeStatus: { fontSize: 12, marginTop: 2 },
  chevron: { color: '#6B7280', fontSize: 24 },
  backBtn: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 14,
    paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(59,130,246,0.15)',
  },
  backText: { color: '#3B82F6', fontSize: 16, fontWeight: '700' },
  routeHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  routeNumberLg: {
    width: 50, height: 50, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  routeNumberLgText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  routeHeaderName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  detailScroll: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { color: '#9CA3AF', fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  stopCard: { flexDirection: 'row', marginBottom: 2 },
  stopTimeline: { width: 24, alignItems: 'center' },
  stopDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  stopLine: { width: 2, flex: 1, opacity: 0.3 },
  stopInfo: { flex: 1, paddingLeft: 12, paddingBottom: 14 },
  stopName: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  busArrivalRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 4,
  },
  busScheduleTime: {
    color: '#9CA3AF', fontSize: 12, fontWeight: '600',
    marginRight: 10, minWidth: 70,
  },
  busArrivalTime: { color: '#60A5FA', fontSize: 12, fontWeight: '500' },
  busArrivalSoon: { color: '#10B981', fontWeight: '700' },
  stopNoService: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  tripMini: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    padding: 12, marginBottom: 8,
  },
  tripMiniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripHeadsign: { color: '#E5E7EB', fontSize: 13, fontWeight: '600', flex: 1 },
  tripStopRange: { color: '#60A5FA', fontSize: 12, marginTop: 3 },
  tripStopCount: { color: '#6B7280', fontSize: 11, marginTop: 2 },
});
