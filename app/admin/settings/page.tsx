'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  group: string;
  description: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pusher' | 'twilio'>('pusher');
  const [pusherSettings, setPusherSettings] = useState<Setting[]>([]);
  const [twilioSettings, setTwilioSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    document.title = 'Settings - Admin';
    checkAuth();
    fetchSettings();
  }, [activeTab]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const group = activeTab === 'pusher' ? 'pusher' : 'twilio';
      
      // Fetch full settings with descriptions
      const response = await api.get(`/admin/settings?group=${group}`);
      const settings = response.data as Setting[];

      if (activeTab === 'pusher') {
        setPusherSettings(settings);
      } else {
        setTwilioSettings(settings);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin/login');
      } else {
        console.error('Failed to fetch settings:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const settings = activeTab === 'pusher' ? pusherSettings : twilioSettings;
      // Format as object with key-value pairs
      const settingsObject: Record<string, string> = {};
      settings.forEach(s => {
        settingsObject[s.key] = s.value;
      });

      await api.put(`/admin/settings/group/${activeTab}`, { settings: settingsObject });
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: string | boolean) => {
    if (activeTab === 'pusher') {
      setPusherSettings(prev => prev.map(s => s.key === key ? { ...s, value: String(value) } : s));
    } else {
      setTwilioSettings(prev => prev.map(s => s.key === key ? { ...s, value: String(value) } : s));
    }
  };

  const handleTestPusher = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const response = await api.post('/admin/settings/pusher/test');
      setMessage({ type: 'success', text: response.data.message || 'Pusher connection successful' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Pusher connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestTwilio = async () => {
    if (!testPhone) {
      setMessage({ type: 'error', text: 'Please enter a test phone number' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await api.post('/admin/settings/twilio/test', { test_phone: testPhone });
      setMessage({ type: 'success', text: response.data.message || 'Twilio SMS sent successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Twilio SMS failed' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const currentSettings = activeTab === 'pusher' ? pusherSettings : twilioSettings;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('pusher')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'pusher'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pusher Settings
                </button>
                <button
                  onClick={() => setActiveTab('twilio')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'twilio'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Twilio Settings
                </button>
              </nav>
            </div>

            <div className="p-8">
              {message && (
                <div className={`mb-4 px-4 py-3 rounded ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-6">
                {currentSettings.map((setting) => (
                  <div key={setting.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {setting.description || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {setting.type === 'boolean' ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={setting.value === 'true' || setting.value === '1'}
                          onChange={(e) => handleSettingChange(setting.key, e.target.checked ? 'true' : 'false')}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Enable {setting.key.replace(/_/g, ' ')}</span>
                      </label>
                    ) : (
                      <input
                        type={setting.key.includes('secret') || setting.key.includes('token') ? 'password' : 'text'}
                        value={setting.value || ''}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder={setting.description || setting.key}
                      />
                    )}
                  </div>
                ))}

                {activeTab === 'twilio' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Phone Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="+1234567890"
                      />
                      <button
                        onClick={handleTestTwilio}
                        disabled={testing || !testPhone}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {testing ? 'Testing...' : 'Test SMS'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  {activeTab === 'pusher' && (
                    <button
                      onClick={handleTestPusher}
                      disabled={testing}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

