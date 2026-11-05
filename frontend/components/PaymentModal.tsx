'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  credits: number;
  price: number;
  price_inr: string;
}

export default function PaymentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://picartgallery.in/api/v1/payment/plans', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      toast.error('Failed to load plans');
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (plan: Plan) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/signup');
      return;
    }

    setLoading(true);
    try {
      const orderResponse = await fetch(
        `https://picartgallery.in/api/v1/payment/create-order?plan_id=${plan.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (orderResponse.status === 401) {
        toast.error('Please login again');
        router.push('/auth/login');
        setLoading(false);
        return;
      }

      const order = await orderResponse.json();
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setLoading(false);
        return;
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'PicArtGallery',
        description: `Buy ${order.credits} credits`,
        order_id: order.order_id,
        handler: async (response: any) => {
          const verifyResponse = await fetch('https://picartgallery.in/api/v1/payment/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              credits: order.credits,
              amount: order.amount,
            }),
          });
          const result = await verifyResponse.json();
          if (result.success) {
            toast.success(result.message);
            onClose();
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: user?.full_name, email: user?.email },
        theme: { color: '#7c3aed' },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Buy Credits</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isLoggedIn = !!localStorage.getItem('access_token');
            return (
              <div
                key={plan.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  if (!isLoggedIn) {
                    router.push('/auth/signup');
                    return;
                  }
                  handlePurchase(plan);
                }}
              >
                <div className="text-3xl font-bold text-purple-600">{plan.credits}</div>
                <div className="text-gray-600">Credits</div>
                <div className="text-xl font-bold mt-2">{plan.price_inr}</div>
                <button
                  disabled={loading}
                  className="mt-3 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition"
                >
                  {isLoggedIn ? 'Buy Now' : 'Signup to Buy'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>✓ Secure Payment via Razorpay</p>
          <p>✓ UPI, Cards, NetBanking, Wallet</p>
        </div>
      </div>
    </div>
  );
}
