'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/home');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in.';
      if (message.toLowerCase().includes('invalid login credentials') || message.toLowerCase().includes('invalid email or password')) {
        setError('Invalid email or password. Please try again.');
      } else if (message.toLowerCase().includes('email not confirmed')) {
        setError('Please confirm your email address before signing in.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4F6D9A] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3E5C86] rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Voices of Support</h1>
          <p className="text-sm text-white/70 mt-1">Messages of strength from home</p>
        </div>

        <div className="bg-[#E6E6E6] rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-semibold text-[#1F2933] mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1F2933] mb-1.5">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#1F2933]/10 bg-white text-[#1F2933] placeholder-[#1F2933]/40 focus:outline-none focus:ring-2 focus:ring-[#3E5C86] transition" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1F2933] mb-1.5">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#1F2933]/10 bg-white text-[#1F2933] placeholder-[#1F2933]/40 focus:outline-none focus:ring-2 focus:ring-[#3E5C86] transition" />
            </div>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#3E5C86] hover:bg-[#324d73] disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-[#1F2933]/60 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#3E5C86] font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
