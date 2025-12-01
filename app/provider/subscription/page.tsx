'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ProviderNavigation from '@/components/ProviderNavigation';
import api from '@/lib/api';

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
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

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
    try {
      const [statusResponse, plansResponse] = await Promise.all([
        api.get('/provider/subscription/status'),
        api.get('/provider/subscription/plans'),
      ]);
      setSubscription(statusResponse.data.subscription);
      setPlans(plansResponse.data);
      if (statusResponse.data.current_plan) {
        setSelectedPlanId(statusResponse.data.current_plan.id);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/provider/login');
      } else {
        console.error('Failed to fetch data:', error);
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
      toast.error(error.response?.data?.error || 'Failed to upgrade plan. Please try again.');
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
      return <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">No Subscription</span>;
    }
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      incomplete: 'bg-gray-100 text-gray-800',
      trialing: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-3 py-1 text-sm rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProviderNavigation />
        <div className="p-8">Loading...</div>
      </div>
    );
  }

  const isActive = subscription?.status === 'active';
  const currentPlanId = subscription?.subscription_plan_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNavigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold mb-6">Subscription Plans</h1>
          
          {subscription && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
              <div className="flex items-center gap-4 mb-4">
                {getStatusBadge(subscription.status)}
                {subscription.current_plan && (
                  <span className="text-gray-700 font-medium">
                    {subscription.current_plan.name} - ${Number(subscription.current_plan.price).toFixed(2)}/{subscription.current_plan.interval}
                  </span>
                )}
                {subscription.current_period_end && (
                  <span className="text-gray-600">
                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {isActive && (
                <button
                  onClick={handleBillingPortal}
                  disabled={processing}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {processing ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
            </div>
          )}

          {!isActive && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
              <p className="font-semibold">Account Inactive</p>
              <p className="text-sm mt-1">
                Please subscribe to a plan to access leads. Once subscribed, your account will be activated automatically.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlanId === plan.id;
              const currentPlan = plans.find(p => p.id === currentPlanId);
              const planPrice = Number(plan.price);
              const currentPrice = currentPlan ? Number(currentPlan.price) : 0;
              const isUpgrade = isActive && currentPlanId && planPrice > currentPrice;
              const isDowngrade = isActive && currentPlanId && planPrice < currentPrice;

              return (
                <div
                  key={plan.id}
                  className={`bg-white shadow rounded-lg p-6 ${
                    isCurrentPlan ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${Number(plan.price).toFixed(2)}</span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>

                  {plan.trial_days > 0 && (
                    <div className="mb-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {plan.trial_days} day trial
                      </span>
                    </div>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  )}

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-600 px-4 py-2 rounded-md cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isActive ? (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={processing}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Switch Plan'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processing}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Subscribe'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProviderSubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><ProviderNavigation /><div className="p-8">Loading...</div></div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
