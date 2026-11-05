'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signup(email, fullName, password);
      toast.success('Account created! You get 10 free credits.');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setSocialLoading(true);
    const width = 500, height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      'http://localhost:8000/api/v1/auth/google/login',
      'Google Signup',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    window.addEventListener('message', (event) => {
      if (event.data.type === 'google_login_success') {
        localStorage.setItem('access_token', event.data.token);
        toast.success('Google signup successful!');
        router.push('/dashboard');
        popup?.close();
      }
    });
  };

  const handleAppleSignup = () => {
    setSocialLoading(true);
    const width = 500, height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      'http://localhost:8000/api/v1/auth/apple/login',
      'Apple Signup',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    window.addEventListener('message', (event) => {
      if (event.data.type === 'apple_login_success') {
        localStorage.setItem('access_token', event.data.token);
        toast.success('Apple signup successful!');
        router.push('/dashboard');
        popup?.close();
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-purple-600 hover:text-purple-500">
              Sign In
            </Link>
          </p>
        </div>

        {/* Social Signup Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignup}
            disabled={socialLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <FcGoogle className="w-5 h-5" />
            <span>Sign up with Google</span>
          </button>
          
          <button
            onClick={handleAppleSignup}
            disabled={socialLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
          >
            <FaApple className="w-5 h-5" />
            <span>Sign up with Apple</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up - Get 10 Free Credits'}
          </button>
        </form>
      </div>
    </div>
  );
}
