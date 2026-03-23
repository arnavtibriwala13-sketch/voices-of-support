'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { createUserRecord } from '@/lib/db';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        // Create user record in public users table
        await createUserRecord(data.user.id, email);

        // If session exists, email confirmation is disabled — go straight to app
        if (data.session) {
          router.push('/home');
        } else {
          // Email confirmation required
          setInfo(
            'Account created! Please check your email and click the confirmation link, then sign in.'
          );
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account.';
      if (message.toLowerCase().includes('already registered') ||
          message.toLowerCase().includes('user already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6E6E6] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4F6D9A] rounded-2xl mb-4 shadow-md">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1F2933]">Voices of Support</h1>
          <p className="text-sm text-[#1F2933]/60 mt-1">Messages of strength from home</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-[#1F2933] mb-6">Create Account</h2>

          {info ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#8FA87A]/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#8FA87A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[#1F2933] text-sm leading-relaxed">{info}</p>
              <Link
                href="/login"
                className="inline-block w-full bg-[#4F6D9A] text-white font-semibold py-3 px-4 rounded-xl text-center transition hover:bg-[#3E5C86]"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F7] text-[#1F2933] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6D9A] focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F7] text-[#1F2933] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6D9A] focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F7] text-[#1F2933] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6D9A] focus:border-transparent transition"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4F6D9A] hover:bg-[#3E5C86] disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-sm"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {!info && (
            <p className="text-center text-sm text-[#1F2933]/60 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[#4F6D9A] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
