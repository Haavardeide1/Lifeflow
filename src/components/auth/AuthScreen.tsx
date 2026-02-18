'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signin') {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
    } else {
      const result = await signUp(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Check your email for a confirmation link!');
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-[22px] font-bold">Lifeflow</h1>
          <p className="text-[13px] text-white/40 mt-1">Track your habits. Understand yourself.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-[13px] text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-[14px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-[13px] text-white/40 mt-5">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }} className="text-emerald-400 hover:text-emerald-300">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(''); setSuccess(''); }} className="text-emerald-400 hover:text-emerald-300">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
