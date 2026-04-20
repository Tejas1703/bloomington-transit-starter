import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function AlertsBanner({ alerts }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !alerts || alerts.length === 0) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text} numberOfLines={2}>
        {alerts[0].headerText || 'Service alert'}
      </Text>
      <TouchableOpacity onPress={() => setDismissed(true)}>
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 10,
  },
  icon: { fontSize: 18, marginRight: 8 },
  text: { flex: 1, color: '#1F2937', fontSize: 13, fontWeight: '600' },
  dismiss: { color: '#1F2937', fontSize: 18, paddingLeft: 8 },
});
