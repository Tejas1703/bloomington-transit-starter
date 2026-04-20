/**
 * Centralized notification service for BloomTransit.
 *
 * Handles:
 * - Android notification channel setup (required for Android 8+)
 * - Permission requests (including Android 13+ POST_NOTIFICATIONS)
 * - Immediate local notification scheduling
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'bloom-transit-alerts';

/**
 * Must be called once at app startup before scheduling any notification.
 */
export async function setupNotifications() {
  // Implementation removed for public release.
  // Sets up notification handler and creates Android notification channel.
}

/**
 * Request notification permissions.
 */
export async function requestNotificationPermission() {
  // Implementation removed for public release.
  return false;
}

/**
 * Fire a notification as soon as possible.
 */
export async function fireNotification(title, body) {
  // Implementation removed for public release.
  // Schedules a local push notification with proper channel and trigger config.
  console.log(`[Notification] ${title}: ${body}`);
}
