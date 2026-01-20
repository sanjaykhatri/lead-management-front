'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Alert, Box, Button, Card, CardContent, Typography, TextField } from '@mui/material';

export default function ProviderSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Provider Signup - Lead Management';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/provider/signup', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
      });
      
      localStorage.setItem('token', response.data.token);
      toast.success('Account created successfully!');
      router.push('/provider/subscription');
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 4, py: 10 }}>
      <Card sx={{ width: '100%', maxWidth: 640 }}>
        <CardContent sx={{ p: { xs: 6, md: 8 } }}>
          <Typography variant='h4'>Provider sign up</Typography>
          <Typography color='text.secondary' sx={{ mt: 1 }}>
            Already have an account? <Link href='/provider/login'>Sign in</Link>
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mt: 4 }}>
              {error}
            </Alert>
          )}

          <Box component='form' onSubmit={handleSubmit} sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label='Full name'
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label='Email'
              type='email'
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label='Phone (optional)'
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label='Address (optional)'
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              minRows={3}
            />
            <TextField
              label='Password'
              type='password'
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText='Min 6 characters'
            />
            <TextField
              label='Confirm password'
              type='password'
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            <Button type='submit' variant='contained' disabled={isLoading} size='large'>
              {isLoading ? 'Creating…' : 'Create account'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

