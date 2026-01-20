'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Typography
} from '@mui/material';
import FullPageLoader from '@/components/common/FullPageLoader';

interface Subscription {
  id: number;
  status: string;
  current_period_end: string | null;
  stripe_customer_id: string;
  subscription_plan_id: number | null;
  current_plan?: {
    id: number;
    name: string;
    price: number | string;
    interval: string;
  };
}

interface Plan {
  id: number;
  name: string;
  stripe_price_id: string;
  price: number | string;
  interval: 'monthly' | 'yearly';
  trial_days: number;
  features: string[];
  is_active: boolean;
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    document.title = 'Subscription - Provider';
    checkAuth();
    fetchData();
    
    // Check for success/cancel from Stripe
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Subscription successful! Your account is now active.');
      fetchData();
    }
    if (canceled === 'true') {
      toast.error('Subscription was canceled.');
    }
  }, [searchParams]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/provider/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchData = async () => {
    setLoadError('');
    try {
      const [statusResponse, plansResponse] = await Promise.all([
        api.get('/provider/subscription/status'),
        api.get('/provider/subscription/plans'),
      ]);
      setSubscription(statusResponse.data.subscription);
      setPlans(plansResponse.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/provider/login');
      } else {
        // Enhanced error logging
        const statusCode = error?.response?.status;
        const responseData = error?.response?.data;
        const errorMessage = error?.message;
        
        console.error('Failed to fetch subscription data:', {
          status: statusCode,
          statusText: error?.response?.statusText,
          data: responseData,
          message: errorMessage,
          fullError: error,
        });
        
        const msg =
          responseData?.message ||
          responseData?.error ||
          (statusCode === 500 
            ? 'Server error occurred. Please check the backend logs for details.' 
            : 'Failed to load subscription data. Please try again.');
        setLoadError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    setProcessing(true);
    try {
      const response = await api.post('/provider/subscription/checkout', { plan_id: planId });
      toast.success('Redirecting to checkout...');
      window.location.href = response.data.checkout_url;
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null)
        || 'Failed to create checkout session. Please try again.';
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  const handleUpgrade = async (planId: number) => {
    if (!confirm('Are you sure you want to upgrade to this plan? You will be charged a prorated amount.')) {
      return;
    }

    setProcessing(true);
    try {
      await api.post('/provider/subscription/upgrade', { plan_id: planId });
      toast.success('Plan upgraded successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Failed to upgrade:', error);
      const status = error.response?.status;
      const backendError = error.response?.data?.error || error.response?.data?.message;

      if (status === 404 && backendError?.toLowerCase().includes('no active subscription')) {
        toast.error('No active subscription found. Please subscribe to a plan first.');
      } else {
        toast.error(backendError || 'Failed to upgrade plan. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleBillingPortal = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/provider/subscription/billing-portal');
      toast.success('Opening billing portal...');
      window.location.href = response.data.portal_url;
    } catch (error: any) {
      console.error('Failed to open billing portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return <Chip size="small" label="No subscription" variant="outlined" />;
    }
    const color =
      status === 'active'
        ? 'success'
        : status === 'canceled'
          ? 'error'
          : status === 'past_due'
            ? 'warning'
            : status === 'trialing'
              ? 'info'
              : 'default';

    return <Chip size="small" label={status} color={color as any} variant="outlined" />;
  };

  if (loading) {
    return <FullPageLoader />
  }

  const isActive = subscription?.status === 'active';
  const currentPlanId = subscription?.subscription_plan_id;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box>
        <Typography variant="h4">Subscription</Typography>
        <Typography color="text.secondary">Manage your provider subscription and billing.</Typography>
      </Box>

      {loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => { setLoading(true); fetchData(); }}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {subscription && (
        <Card>
          <CardHeader title="Current subscription" />
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {getStatusBadge(subscription.status)}
              {subscription.current_plan && (
                <Typography fontWeight={600}>
                  {subscription.current_plan.name} — ${Number(subscription.current_plan.price).toFixed(2)}/
                  {subscription.current_plan.interval}
                </Typography>
              )}
              {subscription.current_period_end && (
                <Typography color="text.secondary">
                  Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                </Typography>
              )}
            </Box>

            {isActive && (
              <Box sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={handleBillingPortal} disabled={processing}>
                  {processing ? 'Loading…' : 'Manage billing'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {!isActive && (
        <Alert severity="warning">
          <Typography fontWeight={700}>Account inactive</Typography>
          <Typography variant="body2">
            Please subscribe to a plan to access leads. Once subscribed, your account will be activated automatically.
          </Typography>
        </Alert>
      )}

      <Divider />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
        {plans.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const currentPlan = plans.find(p => p.id === currentPlanId);
          const planPrice = Number(plan.price);
          const currentPrice = currentPlan ? Number(currentPlan.price) : 0;
          const isUpgrade = isActive && currentPlanId && planPrice > currentPrice;

          return (
            <Card key={plan.id} variant={isCurrentPlan ? 'outlined' : undefined}>
              <CardHeader
                title={plan.name}
                subheader={`$${Number(plan.price).toFixed(2)} / ${plan.interval}`}
                action={isCurrentPlan ? <Chip size="small" label="Current" color="primary" variant="outlined" /> : null}
              />
              <CardContent>
                {plan.trial_days > 0 && (
                  <Chip size="small" label={`${plan.trial_days} day trial`} color="info" variant="outlined" />
                )}

                {plan.features?.length > 0 && (
                  <Box component="ul" sx={{ mt: 3, mb: 0, pl: 3 }}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <Typography variant="body2" color="text.secondary">
                          {feature}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  {isCurrentPlan ? (
                    <Button fullWidth disabled variant="outlined">
                      Current plan
                    </Button>
                  ) : isActive ? (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={processing}
                    >
                      {processing ? 'Processing…' : isUpgrade ? 'Upgrade' : 'Switch plan'}
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processing}
                    >
                      {processing ? 'Processing…' : 'Subscribe'}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    </Box>
  );
}

export default function ProviderSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <FullPageLoader />
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
