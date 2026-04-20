import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Modal,
} from 'react-native';
import { useTransit } from '../../context/TransitProvider';
import { searchPlaces, getPlaceCoords, geocodeAddress, getCurrentLocation, reverseGeocode } from '../../services/placesService';
import { planTrip, formatMinutes, formatRelativeTime, formatArrivalRelative } from '../../services/tripService';

export default function TripScreen() {
  const { routes, stops, stopRouteMap, scheduleCache, favorites, addFavoriteTrip } = useTransit();

  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [tripResults, setTripResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Time picker state
  const [departMode, setDepartMode] = useState('now'); // 'now' | 'custom'
  const [customHour, setCustomHour] = useState(8);
  const [customMinute, setCustomMinute] = useState(0);
  const [customAmPm, setCustomAmPm] = useState('AM');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const searchTimeout = useRef(null);

  useEffect(() => {
    if (stopRouteMap && Object.keys(stopRouteMap).length > 0 && scheduleCache && Object.keys(scheduleCache).length > 0) {
      setDataReady(true);
    }
  }, [stopRouteMap, scheduleCache]);

  // Debounced address search
  const handleTextChange = useCallback((text, field) => {
    if (field === 'origin') {
      setOriginText(text);
      setOriginCoords(null);
    } else {
      setDestText(text);
      setDestCoords(null);
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length < 2) {
      if (field === 'origin') setOriginSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      const lowerText = text.toLowerCase();
      const matchingStops = stops
        .filter(s => s.stopName.toLowerCase().includes(lowerText))
        .slice(0, 4)
        .map(s => ({ type: 'stop', id: s.stopId, title: s.stopName, subtitle: 'Bus Stop', lat: s.lat, lng: s.lng }));

      const places = await searchPlaces(text);
      const placeSuggestions = places.slice(0, 4).map(p => ({
        type: 'place',
        id: p.placeId,
        title: p.mainText,
        subtitle: p.secondaryText,
        placeId: p.placeId,
      }));

      const all = [...matchingStops, ...placeSuggestions];
      if (field === 'origin') setOriginSuggestions(all);
      else setDestSuggestions(all);
    }, 300);
  }, [stops]);

  async function selectSuggestion(item, field) {
    Keyboard.dismiss();
    if (field === 'origin') {
      setOriginText(item.title);
      setOriginSuggestions([]);
    } else {
      setDestText(item.title);
      setDestSuggestions([]);
    }

    let coords = null;
    if (item.type === 'stop') {
      coords = { latitude: item.lat, longitude: item.lng };
    } else if (item.placeId) {
      coords = await getPlaceCoords(item.placeId);
    }
    if (!coords) coords = await geocodeAddress(item.title);
    if (coords) {
      if (field === 'origin') setOriginCoords(coords);
      else setDestCoords(coords);
    }
  }

  async function useMyLocation() {
    setLocating(true);
    const loc = await getCurrentLocation();
    if (loc) {
      // Validate that location is actually in Bloomington area (not emulator default like Mountain View)
      const isInBloomington = (
        loc.latitude >= 39.05 && loc.latitude <= 39.25 &&
        loc.longitude >= -86.65 && loc.longitude <= -86.40
      );

      if (!isInBloomington) {
        // GPS is set to a non-Bloomington location (common with emulators)
        setOriginText('⚠️ GPS not in Bloomington - type your address');
        setOriginCoords(null);
        setLocating(false);
        setOriginSuggestions([]);
        return;
      }

      setOriginCoords(loc);
      const addr = await reverseGeocode(loc.latitude, loc.longitude);
      setOriginText(addr || 'Current Location');
    } else {
      setOriginText('Could not get location');
    }
    setLocating(false);
    setOriginSuggestions([]);
  }

  // Get departure time in minutes
  function getDepartureMinutes() {
    if (departMode === 'now') return null; // uses current time
    let h = customHour;
    if (customAmPm === 'PM' && h !== 12) h += 12;
    if (customAmPm === 'AM' && h === 12) h = 0;
    return h * 60 + customMinute;
  }

  async function doSearch() {
    if (!originCoords || !destCoords) return;
    Keyboard.dismiss();
    setSearching(true);
    setTripResults(null);

    try {
      const results = planTrip({
        originLat: originCoords.latitude,
        originLng: originCoords.longitude,
        destLat: destCoords.latitude,
        destLng: destCoords.longitude,
        allStops: stops,
        routes,
        stopRouteMap,
        scheduleCache,
        departAfterMinutes: getDepartureMinutes(),
      });
      setTripResults(results);
    } catch (err) {
      console.log('Trip plan error:', err.message);
      setTripResults([]);
    }
    setSearching(false);
  }

  function saveTrip(trip) {
    if (addFavoriteTrip) {
      addFavoriteTrip({
        originText,
        destText,
        originCoords,
        destCoords,
        trip,
        savedAt: Date.now(),
        // Preserve the departure time context so Favorites can recalculate correctly
        departAfterMinutes: getDepartureMinutes(),
      });
    }
  }

  // Time display string
  function timeDisplayStr() {
    if (departMode === 'now') return 'Depart Now';
    return `Depart at ${customHour}:${customMinute.toString().padStart(2, '0')} ${customAmPm}`;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Plan Your Trip</Text>

        {!dataReady && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator color="#3B82F6" size="small" />
            <Text style={styles.loadingBannerText}>Loading route data...</Text>
          </View>
        )}

        {/* Origin Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <TextInput
              style={styles.input}
              placeholder="Where are you? (address or stop)"
              placeholderTextColor="#6B7280"
              value={originText}
              onFocus={() => setActiveField('origin')}
              onChangeText={(t) => handleTextChange(t, 'origin')}
            />
            {originCoords && <Text style={styles.checkMarkIcon}>✓</Text>}
          </View>
          <TouchableOpacity style={styles.myLocationBtn} onPress={useMyLocation} disabled={locating}>
            <Text style={styles.myLocationText}>{locating ? '⏳ Locating...' : '📍 Use my current location'}</Text>
          </TouchableOpacity>

          {originSuggestions.length > 0 && activeField === 'origin' && (
            <View style={styles.suggestions}>
              {originSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item, 'origin')}
                >
                  <Text style={styles.suggestionIcon}>{item.type === 'stop' ? '🚏' : '📍'}</Text>
                  <View style={styles.suggestionTextWrap}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.suggestionSub} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Destination Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <TextInput
              style={styles.input}
              placeholder="Where to? (address or stop)"
              placeholderTextColor="#6B7280"
              value={destText}
              onFocus={() => setActiveField('dest')}
              onChangeText={(t) => handleTextChange(t, 'dest')}
            />
            {destCoords && <Text style={styles.checkMarkIcon}>✓</Text>}
          </View>

          {destSuggestions.length > 0 && activeField === 'dest' && (
            <View style={styles.suggestions}>
              {destSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item, 'dest')}
                >
                  <Text style={styles.suggestionIcon}>{item.type === 'stop' ? '🚏' : '📍'}</Text>
                  <View style={styles.suggestionTextWrap}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.suggestionSub} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Time Picker */}
        <View style={styles.timeSection}>
          <TouchableOpacity
            style={[styles.timeBtn, departMode === 'now' && styles.timeBtnActive]}
            onPress={() => setDepartMode('now')}
          >
            <Text style={[styles.timeBtnText, departMode === 'now' && styles.timeBtnTextActive]}>🕐 Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeBtn, departMode === 'custom' && styles.timeBtnActive]}
            onPress={() => { setDepartMode('custom'); setShowTimePicker(true); }}
          >
            <Text style={[styles.timeBtnText, departMode === 'custom' && styles.timeBtnTextActive]}>
              {departMode === 'custom'
                ? `⏰ ${customHour}:${customMinute.toString().padStart(2, '0')} ${customAmPm}`
                : '⏰ Set Time'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker Modal */}
        {showTimePicker && (
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>Depart at:</Text>
            <View style={styles.timePickerRow}>
              {/* Hour */}
              <View style={styles.timePickerCol}>
                <TouchableOpacity onPress={() => setCustomHour(h => h >= 12 ? 1 : h + 1)} style={styles.timeArrow}>
                  <Text style={styles.timeArrowText}>▲</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerValue}>{customHour}</Text>
                <TouchableOpacity onPress={() => setCustomHour(h => h <= 1 ? 12 : h - 1)} style={styles.timeArrow}>
                  <Text style={styles.timeArrowText}>▼</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timePickerColon}>:</Text>

              {/* Minute */}
              <View style={styles.timePickerCol}>
                <TouchableOpacity onPress={() => setCustomMinute(m => (m + 5) % 60)} style={styles.timeArrow}>
                  <Text style={styles.timeArrowText}>▲</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerValue}>{customMinute.toString().padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setCustomMinute(m => m <= 0 ? 55 : m - 5)} style={styles.timeArrow}>
                  <Text style={styles.timeArrowText}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* AM/PM */}
              <TouchableOpacity
                style={styles.ampmBtn}
                onPress={() => setCustomAmPm(p => p === 'AM' ? 'PM' : 'AM')}
              >
                <Text style={styles.ampmText}>{customAmPm}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.timePickerDone} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.timePickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchBtn, (!originCoords || !destCoords || !dataReady) && styles.searchBtnDisabled]}
          onPress={doSearch}
          disabled={!originCoords || !destCoords || !dataReady || searching}
        >
          {searching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchBtnText}>🔍  Find Buses</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {tripResults !== null && (
          <View style={styles.results}>
            <Text style={styles.resultsHeader}>
              {tripResults.length > 0
                ? `${tripResults.length} option${tripResults.length > 1 ? 's' : ''} found`
                : 'No buses available right now'}
            </Text>

            {tripResults.length === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  Bloomington Transit buses operate limited hours. Try searching for a time during service hours (approx. 6:30 AM - 9:30 PM on weekdays).
                </Text>
              </View>
            )}

            {tripResults.map((trip, idx) => {
              // Calculate time from NOW to bus departure
              const now = new Date();
              const nowMin = now.getHours() * 60 + now.getMinutes();
              const busDepartsMin = trip.legs[0]?.departureMinutes || 0;
              const minsUntilBus = busDepartsMin - nowMin;

              return (
              <View key={idx} style={styles.tripCard}>
                {/* Header - show time from NOW to bus */}
                <View style={styles.tripCardHeader}>
                  <View style={styles.tripTime}>
                    <Text style={styles.tripTotalTime}>
                      {minsUntilBus > 0 ? `Bus in ${formatRelativeTime(minsUntilBus)}` : 'Bus departing now'}
                    </Text>
                    <Text style={styles.tripType}>
                      {trip.type === 'direct' ? 'Direct' : '1 Transfer'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.saveBtn} onPress={() => saveTrip(trip)}>
                    <Text style={styles.saveBtnText}>⭐ Save</Text>
                  </TouchableOpacity>
                </View>

                {/* Show bus departure time prominently */}
                {trip.legs && trip.legs[0] && (
                  <View style={styles.departInfoRow}>
                    <Text style={styles.departInfoLabel}>🚌 Bus departs at </Text>
                    <Text style={styles.departInfoTime}>
                      {formatMinutes(trip.legs[0].departureMinutes)}
                    </Text>
                  </View>
                )}

                {/* Walk to stop - don't show fake walk time, just indicate which stop */}
                <View style={styles.legRow}>
                  <Text style={styles.legIcon}>🚶</Text>
                  <Text style={styles.legText}>
                    Walk to {trip.legs[0].fromStop}
                  </Text>
                </View>

                {/* Bus legs */}
                {trip.legs.map((leg, legIdx) => (
                  <View key={legIdx}>
                    <View style={styles.busLeg}>
                      <View style={[styles.routeBadge, { backgroundColor: leg.routeColor }]}>
                        <Text style={styles.routeBadgeText}>{leg.routeShortName}</Text>
                      </View>
                      <View style={styles.busLegInfo}>
                        <Text style={styles.busLegRoute}>{leg.routeName}</Text>
                        <Text style={styles.busLegDetail}>
                          {leg.fromStop} → {leg.toStop}
                        </Text>
                        <Text style={styles.busLegTimes}>
                          Departs {formatMinutes(leg.departureMinutes)} · {leg.rideMinutes} min ride
                        </Text>
                      </View>
                    </View>

                    {/* Transfer */}
                    {legIdx < trip.legs.length - 1 && (
                      <View style={styles.legRow}>
                        <Text style={styles.legIcon}>🔄</Text>
                        <Text style={styles.legText}>
                          Transfer at {trip.transferStop} ({trip.transferWait} min wait)
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Walk from stop */}
                <View style={styles.legRow}>
                  <Text style={styles.legIcon}>🚶</Text>
                  <Text style={styles.legText}>
                    Walk to destination
                  </Text>
                </View>

                {/* Total ride time */}
                <Text style={styles.tripTotal}>
                  Total ride: {trip.legs.reduce((sum, l) => sum + l.rideMinutes, 0)} min ({trip.type === 'direct' ? 'Direct' : '1 Transfer'})
                </Text>
              </View>
            );})}

          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1629' },
  scroll: { flex: 1 },
  header: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  loadingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.15)', padding: 10, marginHorizontal: 16,
    borderRadius: 10, marginBottom: 10,
  },
  loadingBannerText: { color: '#93C5FD', marginLeft: 8, fontSize: 13 },
  inputSection: { marginHorizontal: 16, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 14 },
  checkMarkIcon: { color: '#10B981', fontSize: 18, fontWeight: '700' },
  myLocationBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  myLocationText: { color: '#60A5FA', fontSize: 13 },
  suggestions: {
    backgroundColor: 'rgba(26,35,64,0.98)', borderRadius: 12,
    marginTop: 4, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionIcon: { fontSize: 18, marginRight: 12, width: 24 },
  suggestionTextWrap: { flex: 1 },
  suggestionTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: '500' },
  suggestionSub: { color: '#6B7280', fontSize: 12, marginTop: 1 },

  // Time picker
  timeSection: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, gap: 8,
  },
  timeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  timeBtnActive: {
    backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3B82F6',
  },
  timeBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  timeBtnTextActive: { color: '#60A5FA' },
  timePickerCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    backgroundColor: 'rgba(26,35,64,0.95)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
  },
  timePickerTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  timePickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  timePickerCol: { alignItems: 'center' },
  timeArrow: { padding: 8 },
  timeArrowText: { color: '#60A5FA', fontSize: 18 },
  timePickerValue: {
    color: '#fff', fontSize: 28, fontWeight: '800',
    minWidth: 50, textAlign: 'center',
  },
  timePickerColon: { color: '#fff', fontSize: 28, fontWeight: '800', marginHorizontal: 4 },
  ampmBtn: {
    backgroundColor: 'rgba(59,130,246,0.2)', paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 8, marginLeft: 8,
  },
  ampmText: { color: '#60A5FA', fontSize: 16, fontWeight: '700' },
  timePickerDone: {
    marginTop: 12, alignSelf: 'center',
    backgroundColor: '#3B82F6', paddingHorizontal: 24,
    paddingVertical: 8, borderRadius: 8,
  },
  timePickerDoneText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  searchBtn: {
    backgroundColor: '#3B82F6', marginHorizontal: 16, marginTop: 8,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  searchBtnDisabled: { backgroundColor: '#1E3A5F', opacity: 0.6 },
  searchBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  results: { marginTop: 20, paddingHorizontal: 16 },
  resultsHeader: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  noResults: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    padding: 20, alignItems: 'center',
  },
  noResultsText: { color: '#6B7280', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  tripCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tripCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tripTime: { flexDirection: 'row', alignItems: 'baseline', flex: 1 },
  tripTotalTime: { color: '#fff', fontSize: 20, fontWeight: '800' },
  tripType: {
    color: '#10B981', fontSize: 12, fontWeight: '600',
    marginLeft: 10, backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  saveBtn: {
    backgroundColor: 'rgba(251,191,36,0.15)', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 8,
  },
  saveBtnText: { color: '#FBBF24', fontSize: 13, fontWeight: '600' },
  legRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 4 },
  legIcon: { fontSize: 16, marginRight: 10, width: 24 },
  legText: { color: '#9CA3AF', fontSize: 13, flex: 1 },
  busLeg: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 12,
    padding: 12, marginVertical: 6,
  },
  routeBadge: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    marginRight: 12, minWidth: 40, alignItems: 'center',
  },
  routeBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  busLegInfo: { flex: 1 },
  busLegRoute: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  busLegDetail: { color: '#9CA3AF', fontSize: 12, marginTop: 3 },
  busLegTimes: { color: '#60A5FA', fontSize: 12, marginTop: 3, fontWeight: '500' },
  departInfoRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 8,
  },
  departInfoLabel: { color: '#9CA3AF', fontSize: 13 },
  departInfoTime: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  tripTotal: {
    color: '#9CA3AF', fontSize: 12, fontWeight: '600',
    textAlign: 'right', marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
