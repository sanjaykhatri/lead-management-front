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

export function usePusherNotifications(
  userId: string | number | null,
  channelName: string,
  eventName: string,
  onEvent: (data: any) => void,
  isProvider: boolean = false
) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId || !channelName) return;

    // Fetch Pusher config from backend
    const setupPusher = async () => {
      try {
        const endpoint = isProvider ? '/provider/settings/pusher' : '/admin/settings/group/pusher';
        const response = await api.get(endpoint);
        const config = response.data as PusherConfig;

        // Config format from getByGroup: { pusher_enabled: true, pusher_app_key: '...', ... }
        // Boolean values are already converted to actual booleans
        const pusherEnabled = config.pusher_enabled === true || config.pusher_enabled === 'true';
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

        // Get base URL without /api suffix
        const baseURL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
        
        // pusherKey and pusherCluster are already extracted above

        // Determine if it's a private channel (requires auth)
        // Private channels start with 'private-' prefix
        const isPrivateChannel = channelName.startsWith('private-');

        // Initialize Pusher
        const pusherOptions: any = {
          cluster: pusherCluster,
          enabledTransports: ['ws', 'wss'],
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

        // Subscribe to channel
        // For public channels like 'admin', use as-is
        // For private channels like 'private-provider.1', use as-is
        channelRef.current = pusherRef.current.subscribe(channelName);

        // Bind to event
        channelRef.current.bind(eventName, onEvent);

        // Connection status
        pusherRef.current.connection.bind('connected', () => {
          console.log('Pusher connected');
        });

        pusherRef.current.connection.bind('error', (err: any) => {
          console.error('Pusher error:', err);
        });
      } catch (error) {
        console.error('Failed to setup Pusher:', error);
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
  }, [userId, channelName, eventName, onEvent]);
}

