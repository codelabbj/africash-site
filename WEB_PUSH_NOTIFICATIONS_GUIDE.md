# Web Push Notifications - Usage Guide

## Overview

This guide shows how to use the web-native push notification initialization function that has been adapted from the Capacitor implementation. The function uses the **africash_foreground** notification channel for all in-app notifications.

## Quick Start

### 1. Import the function

```typescript
import { initializePushNotifications } from '@/lib/push-notifications';
```

### 2. Initialize in your app

Add this to your main layout or app component:

```typescript
'use client';

import { useEffect } from 'react';
import { initializePushNotifications } from '@/lib/push-notifications';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize push notifications when app loads
    initializePushNotifications();
  }, []);

  return <>{children}</>;
}
```

## Features

### ✅ What's Included

1. **Permission Handling**
   - Checks current notification permission status
   - Requests permission if not yet determined
   - Handles denied permissions gracefully

2. **Service Worker Registration**
   - Automatically registers Firebase messaging service worker
   - Required for background message handling

3. **FCM Token Management**
   - Retrieves Firebase Cloud Messaging token
   - Stores token in localStorage
   - Sends token to backend for device registration

4. **Africash Foreground Channel**
   - Channel ID: `africash_foreground`
   - Channel Name: `africash_foreground`
   - High priority notifications
   - Custom icon and badge support
   - Vibration pattern: [200, 100, 200]

5. **Foreground Message Handling**
   - Displays native browser notifications when app is active
   - Handles notification clicks
   - Supports custom data and URLs

6. **Comprehensive Logging**
   - Detailed console logs with timestamps
   - Error tracking and debugging information
   - Similar to Capacitor implementation logging

## API Reference

### `initializePushNotifications()`

Main initialization function. Call this once when your app starts.

```typescript
await initializePushNotifications();
```

**Returns:** `Promise<void>`

**What it does:**
- Checks browser compatibility
- Requests notification permissions
- Registers service worker
- Initializes Firebase Cloud Messaging
- Sets up foreground message listener
- Registers device token with backend

### `getPushToken()`

Get the current FCM registration token.

```typescript
const token = getPushToken();
console.log('Current FCM token:', token);
```

**Returns:** `string | null`

### `isPushInitialized()`

Check if push notifications have been initialized.

```typescript
if (isPushInitialized()) {
  console.log('Push notifications are ready!');
}
```

**Returns:** `boolean`

### `getPermissionStatus()`

Get the current notification permission status.

```typescript
const permission = getPermissionStatus();
// Returns: 'default' | 'granted' | 'denied'
```

**Returns:** `NotificationPermission`

## Console Logs

The initialization function provides detailed logging similar to the Capacitor implementation:

```
🚀 [TEST LOG] initializePushNotifications() called at: 2026-02-05T18:23:16.000Z
🔍 [TEST LOG] Checking platform compatibility...
✅ [TEST LOG] Initializing push notifications on web platform
🔐 [TEST LOG] Checking current push notification permissions...
📋 [TEST LOG] Requesting push notification permissions...
✅ [TEST LOG] Push notification permission granted, setting up...
📢 [TEST LOG] Configuring notification channel: zefast_foreground
📝 [TEST LOG] Registering service worker...
✅ [TEST LOG] Service worker registered successfully
🔥 [TEST LOG] Initializing Firebase Cloud Messaging...
🔑 [TEST LOG] Requesting FCM registration token...
🔔 [TEST LOG] FCM registration success! Token received
📱 [TEST LOG] Platform detected: web, preparing to send token to backend...
👂 [TEST LOG] Setting up foreground message listener...
✅ [TEST LOG] Push notifications initialization completed successfully!
📢 [TEST LOG] Notification channel "africash_foreground" is active
```

## Backend Integration

The function automatically registers the device token with your backend using the `/mobcash/devices/` endpoint:

```typescript
async function registerDeviceOnBackend(token: string, type: 'web'): Promise<void> {
  const { default: api } = await import('./api');
  
  // Send to /mobcash/devices/ endpoint
  await api.post('/mobcash/devices/', {
    registration_id: token,
    type: type,
  });
}
```

**Payload format:**
- `registration_id`: The FCM token
- `type`: Platform type (`'web'`)

The backend endpoint should accept this payload and store the device registration for sending push notifications.
```

## Browser Compatibility

The function checks for the following browser features:
- ✅ Service Worker API
- ✅ Push Manager API
- ✅ Notification API
- ✅ Secure Context (HTTPS or localhost)

If any of these are missing, initialization will gracefully exit with a console warning.

## Notification Channel Configuration

The **zefast_foreground** channel is configured with:

```typescript
{
  id: 'africash_foreground',
  name: 'africash_foreground',
  description: 'All Africash notifications with high priority display',
  importance: 'high',
  badge: '/placeholder-logo.png',
  icon: '/placeholder-logo.png',
  vibrate: [200, 100, 200],
  requireInteraction: false,
}
```

## Error Handling

All errors are logged with detailed information:

```
❌ [TEST LOG] Error initializing push notifications: [error details]
❌ [TEST LOG] Error details: {
  message: "...",
  stack: "...",
  timestamp: "..."
}
```

## Testing

1. **Check initialization:**
   ```typescript
   console.log('Initialized:', isPushInitialized());
   console.log('Token:', getPushToken());
   console.log('Permission:', getPermissionStatus());
   ```

2. **Send a test notification:**
   - Go to Firebase Console → Cloud Messaging
   - Click "Send your first message"
   - Use your FCM token
   - Send the notification

3. **Check console logs:**
   - Open browser DevTools
   - Look for `[TEST LOG]` messages
   - Verify all steps completed successfully

## Differences from Capacitor Version

| Feature | Capacitor | Web |
|---------|-----------|-----|
| Platform Detection | `Capacitor.isNativePlatform()` | Browser feature detection |
| Permission API | `PushNotifications.requestPermissions()` | `Notification.requestPermission()` |
| Registration | `PushNotifications.register()` | Service Worker + FCM |
| Channels | Android notification channels | Web notification configuration |
| Foreground Messages | `pushNotificationReceived` listener | `onMessage` from FCM |
| Local Notifications | `LocalNotifications.schedule()` | Native `Notification` API |

## Next Steps

1. ✅ Initialize push notifications in your app
2. ✅ Configure your backend endpoint for device registration
3. ✅ Test with Firebase Console
4. ✅ Customize notification appearance
5. ✅ Add notification click handlers
6. ✅ Implement notification data handling
