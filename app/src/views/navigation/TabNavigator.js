import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import MapScreen from '../screens/MapScreen';
import TripScreen from '../screens/TripScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F1629', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        tabBarStyle: {
          backgroundColor: '#0F1629',
          borderTopColor: 'rgba(255,255,255,0.08)',
          paddingBottom: 4,
          height: 58,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerTitle: 'BloomTransit',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Trip"
        component={TripScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Plan Trip',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🔍</Text>,
        }}
      />
      <Tab.Screen
        name="Routes"
        component={ScheduleScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Routes',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🚌</Text>,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={FavoritesScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>⭐</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
