'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setSocialLoading(true);
    const width = 500, height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      'http://localhost:8000/api/v1/auth/google/login',
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    window.addEventListener('message', (event) => {
      if (event.data.type === 'google_login_success') {
        localStorage.setItem('access_token', event.data.token);
        toast.success('Google login successful!');
        router.push('/dashboard');
        popup?.close();
      }
    });
  };

  const handleAppleLogin = () => {
    setSocialLoading(true);
    const width = 500, height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      'http://localhost:8000/api/v1/auth/apple/login',
      'Apple Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    window.addEventListener('message', (event) => {
      if (event.data.type === 'apple_login_success') {
        localStorage.setItem('access_token', event.data.token);
        toast.success('Apple login successful!');
        router.push('/dashboard');
        popup?.close();
      }
    });
  };

  const handleSendOtp = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      
      if (response.ok) {
        setOtpSent(true);
        toast.success('OTP sent to your email!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      toast.error('Please enter OTP and new password');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetEmail, 
          otp: otp, 
          new_password: newPassword 
        })
      });
      
      if (response.ok) {
        toast.success('Password reset successful! Please login.');
        setForgotPassword(false);
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setResetEmail('');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  // Forgot Password Modal
  if (forgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            {!otpSent ? 'Forgot Password' : 'Verify OTP'}
          </h2>
          
          {!otpSent ? (
            <>
              <p className="text-gray-600 text-center mb-6">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
              <input
                type="email"
                placeholder="Email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <button
                onClick={handleSendOtp}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
              >
                Send OTP
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-center mb-6">
                Enter the OTP sent to {resetEmail} and your new password.
              </p>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <button
                onClick={handleResetPassword}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Reset Password
              </button>
            </>
          )}
          
          <button
            onClick={() => {
              setForgotPassword(false);
              setOtpSent(false);
              setOtp('');
              setNewPassword('');
              setResetEmail('');
            }}
            className="w-full mt-3 text-gray-600 hover:text-gray-800"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-purple-600 hover:text-purple-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={socialLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <FcGoogle className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
          
          <button
            onClick={handleAppleLogin}
            disabled={socialLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
          >
            <FaApple className="w-5 h-5" />
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
