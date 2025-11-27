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

        // Check if Pusher is enabled
        if (!config.pusher_enabled || !config.pusher_app_key || !config.pusher_app_cluster) {
          console.warn('Pusher not enabled or not configured');
          return;
        }

        // Get base URL without /api suffix
        const baseURL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
        
        const pusherKey = config.pusher_app_key || config.key;
        const pusherCluster = config.pusher_app_cluster || config.cluster;

        if (!pusherKey || !pusherCluster) {
          console.warn('Pusher credentials missing');
          return;
        }

        // Initialize Pusher
        pusherRef.current = new Pusher(pusherKey, {
          cluster: pusherCluster,
          authEndpoint: `${baseURL}/api/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          },
          enabledTransports: ['ws', 'wss'],
        });

        // Subscribe to channel
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

