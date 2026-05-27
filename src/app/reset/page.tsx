'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function ResetPage(): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If Supabase redirected here after clicking the reset link, the client
    // may already have a session. Check for that before allowing a password update.
    let mounted = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Update password for the currently authenticated session
      const payload = { password } as unknown as Parameters<typeof supabase.auth.updateUser>[0];
      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Password updated — you can now sign in.');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-bg-card p-6 card-glass">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Set a new password</h2>
          {!ready ? (
            <p className="text-sm text-text-muted">Follow the link in your email to return here and set a new password.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="flex w-full flex-col text-sm">
                <span className="mb-1 text-text-secondary">New password</span>
                <input
                  aria-label="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-border bg-bg-primary px-3 py-2 text-text-primary"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                />
              </label>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-accent px-4 py-2 text-white disabled:opacity-60"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
