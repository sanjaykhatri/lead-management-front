'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Location {
  id: number;
  name: string;
  slug: string;
  address: string | null;
}

export default function Home() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Select Your Location - Lead Management';
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (err: any) {
      console.error('Failed to fetch locations:', err);
      setError('Failed to load locations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (slug: string) => {
    router.push(`/lead/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Started Today
          </h1>
          <p className="text-xl text-gray-600">
            Select your location to begin
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 text-center">
            {error}
            <button
              onClick={fetchLocations}
              className="ml-4 underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && locations.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg text-center">
            No locations available at this time. Please check back later.
          </div>
        )}

        {!loading && !error && locations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location.slug)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                      {location.name}
                    </h3>
                    {location.address && (
                      <p className="text-sm text-gray-600 mb-4">
                        {location.address}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <div className="text-indigo-600 font-medium text-sm group-hover:underline">
                  Get Started →
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
