'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage(): React.JSX.Element {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen p-6">
      <h1 className="mb-4 text-2xl font-semibold text-text-primary">Settings</h1>
      <div className="rounded-lg border border-border bg-bg-secondary p-4">
        <p className="text-sm text-text-muted">Account</p>
        <p className="mt-1 font-semibold text-text-primary">{email ?? 'Unknown'}</p>
        <p className="mt-2 text-sm text-text-secondary">This page is a placeholder for account settings and role management.</p>
      </div>
    </div>
  );
}
