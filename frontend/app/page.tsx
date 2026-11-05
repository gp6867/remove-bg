'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fallbackPlans = [
    { id: 'plan_basic', credits: 200, price: 1.99, price_inr: '$1.99' },
    { id: 'plan_pro', credits: 600, price: 4.99, price_inr: '$4.99' },
    { id: 'plan_business', credits: 2000, price: 12.99, price_inr: '$12.99' },
    { id: 'plan_enterprise', credits: 10000, price: 49.99, price_inr: '$49.99' },
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://picartgallery.in/api/v1/payment/plans');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Plans fetched:', data);
      setPlans(data.plans || fallbackPlans);
      
    } catch (err) {
      console.error('Failed to fetch plans, using fallback:', err);
      setPlans(fallbackPlans);
      
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchPlans();
        }, 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlanClick = (plan: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/signup');
      return;
    }
    router.push('/dashboard');
  };

  const features = [
    { icon: '🎨', title: 'Remove Background', desc: 'AI-powered background removal in seconds' },
    { icon: '🔍', title: 'Upscale Images', desc: 'Enhance resolution up to 8x' },
    { icon: '✨', title: 'Face Enhancement', desc: 'Perfect portraits with AI' },
    { icon: '🤖', title: 'AI Generation', desc: 'Create images from text prompts' },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              AI Image Processing
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                Made Simple
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
              Remove backgrounds, upscale images, generate AI art, and more.
              Professional-grade AI tools at your fingertips.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {user ? (
                <Link href="/dashboard" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
                    Get Started Free
                  </Link>
                  <Link href="/auth/login" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to transform your images</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">Pay only for what you use</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-500">Loading plans...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan: any) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanClick(plan)}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition cursor-pointer border border-gray-100 hover:border-purple-300"
                >
                  <h3 className="text-xl font-bold mb-2">{plan.credits} Credits</h3>
                  <div className="text-3xl font-bold text-purple-600 mb-4">{plan.price_inr}</div>
                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition">
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {!loading && plans.length > 0 && plans[0]?.id === 'plan_basic' && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Pricing loaded. {retryCount > 0 && `(Retried ${retryCount}x)`}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
