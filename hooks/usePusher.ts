import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import api from '@/lib/api';

interface PusherConfig {
  pusher_enabled?: boolean;
  pusher_app_key?: string;
  pusher_app_cluster?: string;
  key?: string; // Fallback
  cluster?: string; // Fallback
}

interface PusherEventData {
  type?: string;
  lead?: {
    id: number;
    name: string;
    [key: string]: unknown;
  };
  message?: string;
  [key: string]: unknown;
}

export function usePusherNotifications(
  userId: string | number | null,
  channelName: string,
  eventName: string,
  onEvent: (data: PusherEventData) => void,
  isProvider: boolean = false
) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);

  useEffect(() => {
    if (!channelName) {
      console.log('Pusher: Channel name missing', { channelName, userId });
      return;
    }

    // For public channels like 'admin', userId can be null
    if (channelName.startsWith('private-') && !userId) {
      console.log('Pusher: Waiting for userId for private channel', { channelName });
      return;
    }

    // Fetch Pusher config from backend
    const setupPusher = async () => {
      try {
        console.log('Pusher: Setting up...', { endpoint: isProvider ? '/provider/settings/pusher' : '/admin/settings/group/pusher', channelName });
        const endpoint = isProvider ? '/provider/settings/pusher' : '/admin/settings/group/pusher';
        const response = await api.get(endpoint);
        const config = response.data as PusherConfig;

        console.log('Pusher: Config received', { 
          configKeys: Object.keys(config),
          pusher_enabled: config.pusher_enabled,
          has_key: !!config.pusher_app_key,
          has_cluster: !!config.pusher_app_cluster
        });

        // Config format from getByGroup: { pusher_enabled: true, pusher_app_key: '...', ... }
        // Boolean values are already converted to actual booleans
        const pusherEnabled = config.pusher_enabled === true || String(config.pusher_enabled) === 'true';
        const pusherKey = config.pusher_app_key || config.key || '';
        const pusherCluster = config.pusher_app_cluster || config.cluster || '';

        if (!pusherEnabled || !pusherKey || !pusherCluster) {
          console.warn('Pusher not enabled or not configured', { 
            pusherEnabled, 
            pusherKey: pusherKey ? '***' : '', 
            pusherCluster 
          });
          return;
        }

        console.log('Pusher: Config valid, initializing...', { cluster: pusherCluster, channelName });

        // Get base URL without /api suffix
        const baseURL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
        
        // pusherKey and pusherCluster are already extracted above

        // Determine if it's a private channel (requires auth)
        // Private channels start with 'private-' prefix
        const isPrivateChannel = channelName.startsWith('private-');

        // Initialize Pusher
        const pusherOptions: {
          cluster: string;
          enabledTransports: ('ws' | 'wss')[];
          authEndpoint?: string;
          auth?: {
            headers: {
              Authorization: string;
            };
          };
        } = {
          cluster: pusherCluster,
          enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
        };

        // Add auth for private channels only
        if (isPrivateChannel) {
          pusherOptions.authEndpoint = `${baseURL}/api/broadcasting/auth`;
          pusherOptions.auth = {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          };
        }

        pusherRef.current = new Pusher(pusherKey, pusherOptions);

        // Connection status callbacks
        pusherRef.current.connection.bind('connected', () => {
          console.log('✅ Pusher connected successfully', { channelName, eventName });
        });

        pusherRef.current.connection.bind('connecting', () => {
          console.log('🔄 Pusher connecting...', { channelName });
        });

        pusherRef.current.connection.bind('disconnected', () => {
          console.log('❌ Pusher disconnected', { channelName });
        });

        pusherRef.current.connection.bind('error', (err: Error) => {
          console.error('❌ Pusher connection error:', err, { channelName });
        });

        pusherRef.current.connection.bind('state_change', (states: { previous: string; current: string }) => {
          console.log('🔄 Pusher state changed:', states.previous, '->', states.current, { channelName });
        });

        // Subscribe to channel
        console.log('Pusher: Subscribing to channel', { channelName, isPrivateChannel });
        channelRef.current = pusherRef.current.subscribe(channelName);

        // Channel subscription callbacks
        channelRef.current.bind('pusher:subscription_succeeded', () => {
          console.log('✅ Pusher channel subscribed successfully', { channelName });
        });

        channelRef.current.bind('pusher:subscription_error', (err: Error) => {
          console.error('❌ Pusher subscription error:', err, { channelName });
        });

        // Bind to event
        console.log('Pusher: Binding to event', { eventName, channelName });
        channelRef.current.bind(eventName, (data: PusherEventData) => {
          console.log('📨 Pusher event received', { eventName, channelName, data });
          onEvent(data);
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorResponse = (error as { response?: { data?: unknown } })?.response?.data;
        console.error('❌ Failed to setup Pusher:', error, {
          message: errorMessage,
          response: errorResponse,
          channelName
        });
      }
    };

    setupPusher();

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind(eventName);
        pusherRef.current?.unsubscribe(channelName);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [userId, channelName, eventName, onEvent, isProvider]);
}

