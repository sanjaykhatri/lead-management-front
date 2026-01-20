'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Alert, Box, Button, Card, CardContent, CardHeader, Divider, Tab, Tabs, TextField, Typography } from '@mui/material';
import FullPageLoader from '@/components/common/FullPageLoader';

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
    return <FullPageLoader />;
  }

  const currentSettings = activeTab === 'pusher' ? pusherSettings : twilioSettings;

  return (
    <Box sx={{ mx: 'auto', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box>
        <Typography variant='h4'>Settings</Typography>
        <Typography color='text.secondary'>Configure system integrations and credentials.</Typography>
      </Box>

      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ px: 2 }}
        >
          <Tab value='pusher' label='Pusher' />
          <Tab value='twilio' label='Twilio' />
        </Tabs>
        <Divider />
        <CardHeader title={activeTab === 'pusher' ? 'Pusher settings' : 'Twilio settings'} />
        <CardContent>
          {message && (
            <Alert severity={message.type === 'success' ? 'success' : 'error'} sx={{ mb: 4 }}>
              {message.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {currentSettings.map((setting) => (
              <Box key={setting.key}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  {setting.description ||
                    setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Typography>
                {setting.type === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type='checkbox'
                      checked={setting.value === 'true' || setting.value === '1'}
                      onChange={(e) => handleSettingChange(setting.key, e.target.checked ? 'true' : 'false')}
                    />
                    <Typography color='text.secondary'>Enable {setting.key.replace(/_/g, ' ')}</Typography>
                  </label>
                ) : (
                  <TextField
                    type={setting.key.includes('secret') || setting.key.includes('token') ? 'password' : 'text'}
                    value={setting.value || ''}
                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    placeholder={setting.description || setting.key}
                    fullWidth
                    size='small'
                  />
                )}
              </Box>
            ))}

            {activeTab === 'twilio' && (
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Test phone
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    type='tel'
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder='+1234567890'
                    fullWidth
                    size='small'
                  />
                  <Button variant='outlined' onClick={handleTestTwilio} disabled={testing || !testPhone}>
                    {testing ? 'Testing…' : 'Test SMS'}
                  </Button>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button variant='contained' onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
              {activeTab === 'pusher' && (
                <Button variant='outlined' onClick={handleTestPusher} disabled={testing}>
                  {testing ? 'Testing…' : 'Test connection'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

