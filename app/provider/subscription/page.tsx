'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Subscription {
  id: number;
  status: string;
  current_period_end: string | null;
  stripe_customer_id: string;
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    document.title = 'Subscription - Provider';
    checkAuth();
    fetchSubscriptionStatus();
    
    // Check for success/cancel from Stripe
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      alert('Subscription successful! Your account is now active.');
      fetchSubscriptionStatus();
    }
    if (canceled === 'true') {
      alert('Subscription was canceled.');
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

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/provider/subscription/status');
      setSubscription(response.data.subscription);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/provider/login');
      } else {
        console.error('Failed to fetch subscription:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/provider/subscription/checkout');
      window.location.href = response.data.checkout_url;
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      alert('Failed to create checkout session. Please try again.');
      setProcessing(false);
    }
  };

  const handleBillingPortal = async () => {
    setProcessing(true);
    try {
      const response = await api.get('/provider/subscription/billing-portal');
      window.location.href = response.data.portal_url;
    } catch (error: any) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
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
    return <div className="p-8">Loading...</div>;
  }

  const isActive = subscription?.status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/provider/dashboard" className="text-gray-500 hover:text-gray-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-6">Subscription Plan</h1>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              <div className="flex items-center gap-4 mb-4">
                {getStatusBadge(subscription?.status || null)}
                {subscription?.current_period_end && (
                  <span className="text-gray-600">
                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {!isActive && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                  <p className="font-semibold">Account Inactive</p>
                  <p className="text-sm mt-1">
                    Please subscribe to a plan to access leads. Once subscribed, your account will be activated automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-2">Lead Management Plan</h3>
                <p className="text-gray-600 mb-4">
                  Subscribe to access and manage your assigned leads. Your subscription will be activated automatically upon successful payment.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                  <li>Access to all assigned leads</li>
                  <li>Update lead status</li>
                  <li>View lead details</li>
                  <li>Filter and search leads</li>
                </ul>
              </div>

              {!isActive ? (
                <button
                  onClick={handleSubscribe}
                  disabled={processing}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 font-semibold"
                >
                  {processing ? 'Processing...' : 'Subscribe Now'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                    <p className="font-semibold">Your subscription is active!</p>
                    <p className="text-sm mt-1">You can now access all your assigned leads.</p>
                  </div>
                  <button
                    onClick={handleBillingPortal}
                    disabled={processing}
                    className="w-full bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    {processing ? 'Loading...' : 'Manage Billing'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProviderSubscriptionPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}

