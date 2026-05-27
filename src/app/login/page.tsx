'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function LoginPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const router = useRouter();

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrors({ form: error.message });
        toast.error(error.message);
        return;
      }

      const token = data.session?.access_token;
      if (token) {
        // set cookie for 7 days
        document.cookie = `sb-access-token=${token}; path=/; max-age=604800`;
      }

      toast.success('Signed in');
      // respect redirect query param if present
      try {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') ?? '/dashboard';
        router.push(redirect);
      } catch {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-bg-card p-6 card-glass">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Sign in to AppForgeAI</h2>
          <p className="mb-4 text-sm text-text-muted">Enter your email and password to access the dashboard.</p>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label className="flex w-full flex-col text-sm">
              <span className="mb-1 text-text-secondary">Email</span>
              <input
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded border border-border bg-bg-primary px-3 py-2 text-text-primary ${
                  errors.email ? 'ring-1 ring-error' : ''
                }`}
                placeholder="you@example.com"
                inputMode="email"
                autoComplete="email"
              />
              {errors.email && <span className="mt-1 text-xs text-error">{errors.email}</span>}
            </label>

            <label className="flex w-full flex-col text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-text-secondary">Password</span>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-xs text-text-muted"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded border border-border bg-bg-primary px-3 py-2 text-text-primary ${
                  errors.password ? 'ring-1 ring-error' : ''
                }`}
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
              />
              {errors.password && <span className="mt-1 text-xs text-error">{errors.password}</span>}
            </label>

            {errors.form && <div className="text-sm text-error">{errors.form}</div>}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-accent px-4 py-2 text-white disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="flex items-center gap-3">
                <a className="text-sm text-text-muted" href="/signup">Create account</a>
                <a className="text-sm text-text-muted" href="/forgot">Forgot?</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
