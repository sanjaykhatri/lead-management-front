'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { usePusherNotifications } from '@/hooks/usePusher';

interface Notification {
  id: string;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState<number | null>(null);

  // Fetch admin ID
  useEffect(() => {
    const fetchAdminId = async () => {
      try {
        const response = await api.get('/admin/user');
        setAdminId(response.data.user?.id || null);
      } catch (error) {
        console.error('Failed to fetch admin ID:', error);
      }
    };
    fetchAdminId();
  }, []);

  // Handle real-time notifications - Lead Assigned
  const handleLeadAssigned = useCallback((data: any) => {
    const message = data.message || `New lead assigned: ${data.lead.name}`;
    
    // Show toast notification
    toast.success(message, {
      icon: '🔔',
      duration: 4000,
    });

    const newNotification: Notification = {
      id: `pusher-${Date.now()}-assigned`,
      type: 'lead_assigned',
      data: {
        message: message,
        lead_id: data.lead.id,
      },
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    fetchUnreadCount();
    
    // Trigger page refresh or update leads list if on dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leadAssigned', { detail: data }));
    }
  }, []);

  // Handle real-time notifications - Status Updated
  const handleStatusUpdated = useCallback((data: any) => {
    const message = data.message || `Lead '${data.lead.name}' status changed from ${data.lead.old_status || 'N/A'} to ${data.lead.status}`;
    
    // Show toast notification
    toast.success(message, {
      icon: '📝',
      duration: 4000,
    });

    const newNotification: Notification = {
      id: `pusher-${Date.now()}-status`,
      type: 'lead_status_updated',
      data: {
        message: message,
        lead_id: data.lead.id,
      },
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    fetchUnreadCount();
    
    // Trigger page refresh or update leads list if on dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leadStatusUpdated', { detail: data }));
    }
  }, []);

  // Handle real-time notifications - Note Created
  const handleNoteCreated = useCallback((data: any) => {
    const message = data.message || `New note added to lead '${data.lead.name}' by ${data.note.created_by || 'Someone'}`;
    
    // Show toast notification
    toast.success(message, {
      icon: '💬',
      duration: 4000,
    });

    const newNotification: Notification = {
      id: `pusher-${Date.now()}-note`,
      type: 'lead_note_created',
      data: {
        message: message,
        lead_id: data.lead.id,
        note_id: data.note.id,
      },
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    fetchUnreadCount();
    
    // Trigger page refresh for notes if on lead detail page
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leadNoteCreated', { detail: data }));
    }
  }, []);

  // Setup Pusher for real-time notifications - Lead Assigned
  // Admin channel is public, so we can use 'admin' as userId placeholder
  usePusherNotifications(
    'admin', // Public channel doesn't need real userId
    'admin',
    'lead.assigned',
    handleLeadAssigned,
    false // isProvider
  );

  // Setup Pusher for real-time notifications - Status Updated
  usePusherNotifications(
    'admin', // Public channel doesn't need real userId
    'admin',
    'lead.status.updated',
    handleStatusUpdated,
    false // isProvider
  );

  // Setup Pusher for real-time notifications - Note Created
  usePusherNotifications(
    'admin', // Public channel doesn't need real userId
    'admin',
    'lead.note.created',
    handleNoteCreated,
    false // isProvider
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
      const response = await api.get('/admin/notifications/unread');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/notifications');
      setNotifications(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/admin/notifications/${id}/read`);
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
      await api.post('/admin/notifications/read-all');
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
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ring-offset-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
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
                    !notification.read_at ? 'bg-indigo-50/60' : ''
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
                      <span className="ml-2 mt-1 h-2 w-2 rounded-full bg-indigo-500" />
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

