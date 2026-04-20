import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { TransitProvider } from './src/context/TransitProvider';
import TabNavigator from './src/views/navigation/TabNavigator';
import { setupNotifications, requestNotificationPermission } from './src/services/notificationService';

// Run notification channel setup at module load (before any component renders)
setupNotifications();

export default function App() {
  // Request notification permission early so the user sees the prompt once
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <TransitProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <TabNavigator />
      </NavigationContainer>
    </TransitProvider>
  );
}
