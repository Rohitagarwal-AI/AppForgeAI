'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage(): React.JSX.Element {
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
      <h1 className="mb-4 text-2xl font-semibold text-text-primary">Dashboard</h1>
      <div className="grid gap-4">
        <div className="rounded-lg border border-border bg-bg-secondary p-4">
          <p className="text-sm text-text-muted">Signed in as</p>
          <p className="mt-1 font-semibold text-text-primary">{email ?? 'Unknown'}</p>
        </div>
        <div className="rounded-lg border border-border bg-bg-secondary p-4">
          <p className="text-sm text-text-muted">Main generator</p>
          <p className="mt-1 text-sm text-text-primary">The main generation pipeline is available at / (Generate App).</p>
        </div>
      </div>
    </div>
  );
}
