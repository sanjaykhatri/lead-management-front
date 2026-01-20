'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Alert, Box, Button, Card, CardContent, Typography, TextField } from '@mui/material';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Admin Login - Lead Management';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/admin/login', formData);
      localStorage.setItem('token', response.data.token);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 4, py: 10 }}>
      <Box sx={{ width: '100%', maxWidth: 1040, display: 'grid', gap: 6, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Card
          sx={{
            display: { xs: 'none', md: 'block' },
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'common.white'
          }}
        >
          <CardContent sx={{ p: 8 }}>
            <Box sx={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)' }}>
              <Typography fontWeight={700}>LM</Typography>
            </Box>
            <Typography variant='h4' sx={{ mt: 6, fontWeight: 700 }}>
              Lead Management
            </Typography>
            <Typography sx={{ mt: 2, opacity: 0.85 }}>
              Sign in to access the admin dashboard and manage leads, providers, locations, and settings.
            </Typography>
            <Box sx={{ mt: 6, display: 'grid', gap: 1, opacity: 0.9 }}>
              <Typography>• Real-time notifications</Typography>
              <Typography>• CSV exports</Typography>
              <Typography>• Provider subscriptions</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 6, md: 8 } }}>
            <Typography variant='h4'>Admin sign in</Typography>
            <Typography color='text.secondary' sx={{ mt: 1 }}>
              Use your admin credentials to continue.
            </Typography>

            <Box component='form' onSubmit={handleSubmit} sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {error && <Alert severity='error'>{error}</Alert>}
              <TextField
                label='Email'
                type='email'
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <TextField
                label='Password'
                type='password'
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Button type='submit' variant='contained' disabled={isLoading} size='large'>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

