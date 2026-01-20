'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Alert, Box, Button, Card, CardContent, Typography, TextField } from '@mui/material'

export default function ProviderForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Backend endpoint not implemented in this project yet.
    // Keep the UI consistent with the new theme and provide a safe message.
    toast.success('If an account exists for this email, you’ll receive reset instructions.')
    setIsLoading(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 4, py: 10 }}>
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: { xs: 6, md: 8 } }}>
          <Typography variant='h4'>Forgot password</Typography>
          <Typography color='text.secondary' sx={{ mt: 1 }}>
            Enter your email to receive reset instructions.
          </Typography>

          <Alert severity='info' sx={{ mt: 4 }}>
            Password reset emails are not configured yet. This screen is ready; we can wire it to the backend when available.
          </Alert>

          <Box component='form' onSubmit={handleSubmit} sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label='Email'
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type='submit' variant='contained' disabled={isLoading} size='large'>
              {isLoading ? 'Sending…' : 'Send reset link'}
            </Button>
          </Box>

          <Typography color='text.secondary' sx={{ mt: 4 }}>
            <Link href='/provider/login'>Back to sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

