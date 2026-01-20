'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Alert, Box, Button, Card, CardContent, Typography, TextField } from '@mui/material';

export default function ProviderLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Provider Login - Lead Management';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/provider/login', formData);
      localStorage.setItem('token', response.data.token);
      toast.success('Login successful!');
      
      // Check subscription status
      if (!response.data.has_active_subscription) {
        router.push('/provider/subscription');
      } else {
        router.push('/provider/dashboard');
      }
    } catch (err: any) {
      // Show specific message for inactive accounts
      if (err.response?.data?.account_inactive) {
        setError('Your account has been deactivated. Please contact admin to activate your account.');
        toast.error('Your account has been deactivated. Please contact admin to activate your account.');
      } else {
        const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 4, py: 10 }}>
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: { xs: 6, md: 8 } }}>
          <Typography variant='h4'>Provider sign in</Typography>
          <Typography color='text.secondary' sx={{ mt: 1 }}>
            Don&apos;t have an account? <Link href='/provider/signup'>Sign up</Link>
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mt: 4 }}>
              {error}
            </Alert>
          )}

          <Box component='form' onSubmit={handleSubmit} sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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

          <Typography color='text.secondary' sx={{ mt: 4 }}>
            <Link href='/provider/forgot-password'>Forgot password?</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

