'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Request a password reset email; Supabase will send a link to the user.
      const opts: Record<string, string> = { redirectTo: `${window.location.origin}/reset` };
      const { error } = await supabase.auth.resetPasswordForEmail(email, opts);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Password reset email sent — check your inbox.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-bg-card p-6 card-glass">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Reset your password</h2>
          <p className="mb-4 text-sm text-text-muted">Enter your account email and we will send a password reset link.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex w-full flex-col text-sm">
              <span className="mb-1 text-text-secondary">Email</span>
              <input
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-border bg-bg-primary px-3 py-2 text-text-primary"
                placeholder="you@example.com"
                inputMode="email"
                autoComplete="email"
              />
            </label>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-accent px-4 py-2 text-white disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send reset email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
