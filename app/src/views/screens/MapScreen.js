import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTransit } from '../../context/TransitProvider';
import { useArrivals } from '../../viewmodels/useArrivals';
import { useNearestBus } from '../../viewmodels/useNearestBus';
import { DEFAULT_REGION } from '../../models/utils/constants';
import { getCurrentLocation } from '../../services/placesService';
import BusMarker from '../components/BusMarker';
import StopMarker from '../components/StopMarker';
import AlertsBanner from '../components/AlertsBanner';
import BusDetailSheet from '../components/BusDetailSheet';
import StopDetailSheet from '../components/StopDetailSheet';
import ProximityAlertCard from '../components/ProximityAlertCard';

export default function MapScreen() {
  const {
    routes, stops, shapes, vehicles, loading, alerts, trackedAlerts,
    selectedRoutes, userLocation, setUserLocation,
  } = useTransit();
  const { arrivals, loadingArrivals, getArrivals, clearArrivals } = useArrivals();
  const { nearestResult, searching, findNearest, clearNearest } = useNearestBus();

  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const mapRef = useRef(null);

  // Don't auto-fetch location on mount (causes ANR on emulator)
  // Location is fetched when user taps the 📍 button

  // Center on user location
  function centerOnUser() {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 800);
    } else {
      // Try to get location again
      getCurrentLocation().then(loc => {
        if (loc) {
          setUserLocation(loc);
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: loc.latitude,
              longitude: loc.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }, 800);
          }
        }
      });
    }
  }

  function handleBusPress(vehicle) {
    setSelectedBus(vehicle);
    setSelectedStop(null);
    clearArrivals();
  }

  function handleStopPress(stop) {
    setSelectedStop(stop);
    setSelectedBus(null);
    getArrivals(stop.stopId);
  }

  function handleDismiss() {
    setSelectedBus(null);
    setSelectedStop(null);
    clearArrivals();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading transit data...</Text>
      </View>
    );
  }

  // Filter based on selected routes from Routes tab
  const hasSelectedRoutes = selectedRoutes && selectedRoutes.length > 0;

  return (
    <View style={styles.container}>
      {/* alerts banner at top */}
      {alerts.length > 0 && <AlertsBanner alerts={alerts} />}

      {/* proximity alert cards */}
      {trackedAlerts.filter(a => !a.fired).map(alert => (
        <ProximityAlertCard key={alert.vehicleId} alert={alert} />
      ))}

      {/* Info banner when no routes selected */}
      {!hasSelectedRoutes && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            📋 Go to Routes tab and select routes to display on the map
          </Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        customMapStyle={darkMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* route polylines - only show selected routes */}
        {routes.map(route => {
          const pts = shapes[route.routeId];
          if (!pts || pts.length === 0) return null;
          if (!hasSelectedRoutes) return null;
          if (!selectedRoutes.includes(route.routeId)) return null;
          return (
            <Polyline
              key={route.routeId}
              coordinates={pts.map(p => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor={route.routeColor}
              strokeWidth={3}
            />
          );
        })}

        {/* stop markers - only for selected routes */}
        {hasSelectedRoutes && stops.map(stop => (
          <StopMarker
            key={stop.stopId}
            stop={stop}
            onPress={() => handleStopPress(stop)}
          />
        ))}

        {/* bus markers - only for selected routes */}
        {vehicles
          .filter(v => !hasSelectedRoutes ? false : selectedRoutes.includes(v.routeId))
          .map(v => (
            <BusMarker
              key={v.vehicleId}
              vehicle={v}
              routes={routes}
              onPress={() => handleBusPress(v)}
            />
          ))}
      </MapView>

      {/* My location FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={centerOnUser}
      >
        <Text style={styles.fabText}>📍</Text>
      </TouchableOpacity>

      {/* Selected routes count badge */}
      {hasSelectedRoutes && (
        <View style={styles.routeCountBadge}>
          <Text style={styles.routeCountText}>
            {selectedRoutes.length} route{selectedRoutes.length > 1 ? 's' : ''} on map
          </Text>
        </View>
      )}

      {/* bottom sheets */}
      {selectedBus && (
        <BusDetailSheet
          vehicle={selectedBus}
          routes={routes}
          onDismiss={handleDismiss}
        />
      )}
      {selectedStop && (
        <StopDetailSheet
          stop={selectedStop}
          arrivals={arrivals}
          loading={loadingArrivals}
          onDismiss={handleDismiss}
        />
      )}
    </View>
  );
}

// google maps dark mode style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1629',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  infoBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(15,22,41,0.92)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  infoBannerText: {
    color: '#93C5FD',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
  },
  routeCountBadge: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: 'rgba(15,22,41,0.9)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  routeCountText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
});
