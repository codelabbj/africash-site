/**
 * Web Push Notification Initialization
 * Adapted from Capacitor implementation for web browsers
 * 
 * This module provides comprehensive push notification setup for web applications
 * with detailed logging and error handling similar to the Capacitor implementation.
 */

import { fcmService, getNotificationPermission } from '@/lib/firebase';
import type { MessagePayload } from 'firebase/messaging';

// Track initialization state
let isInitialized = false;
let registrationToken: string | null = null;

// Notification channel configuration for web
const NOTIFICATION_CHANNEL = {
    id: 'africash_foreground',
    name: 'africash_foreground',
    description: 'All Africash notifications with high priority display',
    // Web doesn't have Android-style channels, but we can use these for consistency
    importance: 'high' as const,
    badge: '/placeholder-logo.png',
    icon: '/placeholder-logo.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
};

/**
 * Register device token with backend
 */
async function registerDeviceOnBackend(token: string, type: 'web'): Promise<void> {
    console.log(`📱 [TEST LOG] Attempting to register device on backend for ${type} platform`);
    console.log(`📱 [TEST LOG] Token length: ${token.length}, Token preview: ${token.substring(0, 30)}...`);

    try {
        // Import api client dynamically to avoid circular dependencies
        const { default: api } = await import('./api');

        // Send to /mobcash/devices/ endpoint with required payload format
        await api.post('/mobcash/devices/', {
            registration_id: token,
            type: type,
        });

        console.log('✅ [TEST LOG] Device successfully registered on backend');
    } catch (error) {
        console.error('❌ [TEST LOG] Error registering device on backend:', error);
    }
}

/**
 * Show a native browser notification
 */
function showNativeNotification(
    title: string,
    body: string,
    data?: any
): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('⚠️ [TEST LOG] Notification API not available');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.warn('⚠️ [TEST LOG] Notification permission not granted');
        return;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: NOTIFICATION_CHANNEL.icon,
            badge: NOTIFICATION_CHANNEL.badge,
            tag: `${NOTIFICATION_CHANNEL.id}_${Date.now()}`,
            requireInteraction: NOTIFICATION_CHANNEL.requireInteraction,
            data,
            // @ts-ignore - vibrate is supported in some browsers but not in standard NotificationOptions
            vibrate: NOTIFICATION_CHANNEL.vibrate,
        } as NotificationOptions);

        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();

            // Handle custom data (e.g., navigate to URL)
            if (data?.url) {
                window.open(data.url, '_blank');
            }

            notification.close();
        };

        console.log('✅ [TEST LOG] Native notification displayed successfully');
    } catch (error) {
        console.error('❌ [TEST LOG] Error showing native notification:', error);
    }
}

/**
 * Initialize Push Notifications for Web
 * 
 * This function mirrors the Capacitor implementation but uses Web APIs:
 * - Notification API for permissions
 * - Service Worker for background messages
 * - Firebase Cloud Messaging for token management
 */
export async function initializePushNotifications(): Promise<void> {
    console.log('🚀 [TEST LOG] initializePushNotifications() called at:', new Date().toISOString());

    // Don't initialize multiple times
    if (isInitialized) {
        console.log('⚠️ [TEST LOG] Push notifications already initialized, skipping...');
        return;
    }

    console.log('🔍 [TEST LOG] Checking platform compatibility...');

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        console.log('❌ [TEST LOG] Push notifications not available on server-side - exiting');
        return;
    }

    // Check browser support for required APIs
    if (!('serviceWorker' in navigator)) {
        console.log('❌ [TEST LOG] Service Worker not supported in this browser - exiting');
        return;
    }

    if (!('PushManager' in window)) {
        console.log('❌ [TEST LOG] Push API not supported in this browser - exiting');
        return;
    }

    if (!('Notification' in window)) {
        console.log('❌ [TEST LOG] Notification API not supported in this browser - exiting');
        return;
    }

    if (!window.isSecureContext) {
        console.log('❌ [TEST LOG] Push notifications require HTTPS or localhost - exiting');
        return;
    }

    const platform = 'web';
    console.log(`✅ [TEST LOG] Initializing push notifications on ${platform} platform`);
    console.log(`ℹ️ [TEST LOG] Platform: ${platform}, Browser: ${navigator.userAgent}`);

    try {
        // Check current permission state
        console.log('🔐 [TEST LOG] Checking current push notification permissions...');
        let permStatus = Notification.permission;
        console.log('🔐 [TEST LOG] Current permission status:', permStatus);

        // Request permission if not yet determined
        if (permStatus === 'default') {
            console.log('📋 [TEST LOG] Requesting push notification permissions...');
            permStatus = await Notification.requestPermission();
            console.log('📋 [TEST LOG] Permission request result:', permStatus);
        } else if (permStatus === 'denied') {
            console.warn('🚫 [TEST LOG] Push notification permission denied by user.');
            console.warn('🚫 [TEST LOG] User can enable it in browser settings.');
            return;
        } else if (permStatus === 'granted') {
            console.log('✅ [TEST LOG] Push notification permission already granted');
        }

        // Verify permission was granted
        if (permStatus !== 'granted') {
            console.warn('🚫 [TEST LOG] Push notification permission not granted:', permStatus);
            return;
        }

        console.log('✅ [TEST LOG] Push notification permission granted, setting up...');

        // Configure notification channel (web equivalent)
        console.log(`📢 [TEST LOG] Configuring notification channel: ${NOTIFICATION_CHANNEL.id}`);
        console.log(`📢 [TEST LOG] Channel name: ${NOTIFICATION_CHANNEL.name}`);
        console.log(`📢 [TEST LOG] Channel description: ${NOTIFICATION_CHANNEL.description}`);
        console.log('✅ [TEST LOG] Notification channel configured for web platform');

        // Register service worker FIRST (before setting up listeners)
        console.log('📝 [TEST LOG] Registering service worker...');
        const swRegistration = await fcmService.registerServiceWorker();

        if (!swRegistration) {
            console.error('❌ [TEST LOG] Service worker registration failed - cannot proceed');
            return;
        }

        console.log('✅ [TEST LOG] Service worker registered successfully');

        // Initialize Firebase Cloud Messaging
        console.log('🔥 [TEST LOG] Initializing Firebase Cloud Messaging...');
        await fcmService.initialize();
        console.log('✅ [TEST LOG] Firebase Cloud Messaging initialized');

        // Get FCM token
        console.log('🔑 [TEST LOG] Requesting FCM registration token...');
        const token = fcmService.getToken();

        if (token) {
            console.log('🔔 [TEST LOG] FCM registration success! Token received:', {
                token_preview: token.substring(0, 30) + '...',
                full_token_length: token.length,
                timestamp: new Date().toISOString(),
            });
            registrationToken = token;

            console.log(`📱 [TEST LOG] Platform detected: web, preparing to send token to backend...`);
            console.log(`📱 [TEST LOG] Device registration process starting for web platform`);

            // Register device on backend
            await registerDeviceOnBackend(token, 'web');
        } else {
            console.error('❌ [TEST LOG] Failed to get FCM token');
            return;
        }

        // Setup foreground message listener
        console.log('👂 [TEST LOG] Setting up foreground message listener...');
        fcmService.setupForegroundListener((payload: MessagePayload) => {
            console.log('📨 [TEST LOG] Push notification received while app in foreground:', {
                title: payload.notification?.title,
                body: payload.notification?.body,
                data: payload.data,
                timestamp: new Date().toISOString(),
            });

            // Show native notification when app is in foreground
            const title = payload.notification?.title || 'Notification';
            const body = payload.notification?.body || '';

            showNativeNotification(title, body, payload.data);

            console.log('✅ [TEST LOG] Foreground notification displayed with africash_foreground channel');
        });

        console.log('✅ [TEST LOG] Foreground message listener configured');

        // Mark as initialized
        isInitialized = true;

        console.log('✅ [TEST LOG] Push notifications initialization completed successfully!');
        console.log(`📢 [TEST LOG] Notification channel "${NOTIFICATION_CHANNEL.id}" is active`);
        console.log('⏰ [TEST LOG] Ready to receive push notifications from FCM');

    } catch (error) {
        console.error('❌ [TEST LOG] Error initializing push notifications:', error);
        console.error('❌ [TEST LOG] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Get the current FCM token
 */
export function getPushToken(): string | null {
    return registrationToken;
}

/**
 * Check if push notifications are initialized
 */
export function isPushInitialized(): boolean {
    return isInitialized;
}

/**
 * Get notification permission status
 */
export function getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}
