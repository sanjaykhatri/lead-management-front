'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { usePusherNotifications } from '@/hooks/usePusher';

interface Notification {
  id: string;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
}

export default function ProviderNotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(null);

  // Fetch provider ID
  useEffect(() => {
    const fetchProviderId = async () => {
      try {
        const response = await api.get('/provider/user');
        setProviderId(response.data.provider?.id || null);
      } catch (error) {
        console.error('Failed to fetch provider ID:', error);
      }
    };
    fetchProviderId();
  }, []);

  // Handle real-time notifications
  const handleLeadAssigned = useCallback((data: any) => {
    // Add new notification
    const newNotification: Notification = {
      id: `pusher-${Date.now()}`,
      type: 'lead_assigned',
      data: {
        message: `New lead assigned: ${data.lead.name}`,
        lead_id: data.lead.id,
      },
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    // Also refresh the count from server
    fetchUnreadCount();
  }, []);

  // Setup Pusher for real-time notifications
  usePusherNotifications(
    providerId,
    providerId ? `private-provider.${providerId}` : '',
    'lead.assigned',
    handleLeadAssigned,
    true // isProvider
  );

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds as fallback
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/provider/notifications/unread');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/provider/notifications');
      setNotifications(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/provider/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/provider/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-500 hover:text-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read_at ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read_at) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.data?.message || 'New notification'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

