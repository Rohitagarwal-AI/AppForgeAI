'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  Zap,
  Database,
  FileText,
  BarChart2,
  Settings,
  MessageCircle,
  LogOut,
  LogIn,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type NavItem = {
  href: string;
  label: string;
  Icon?: LucideIcon;
  highlight?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', Icon: Home },
  { href: '/', label: 'Generate App', Icon: Zap },
  { href: '/pipeline-logs', label: 'Pipeline Logs', Icon: FileText },
  { href: '/integrations', label: 'Integrations', Icon: Database },
  { href: '/evaluation', label: 'Evaluation Logs', Icon: BarChart2 },
  { href: '/costs', label: 'Cost Analytics', Icon: BarChart2 },
  { href: '/settings', label: 'Settings', Icon: Settings },
  { href: '/assistant', label: 'AI Assistant', Icon: MessageCircle, highlight: true },
];

export default function Navigation(): React.JSX.Element {
  const [email, setEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    }

    void load();

    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session) {
        document.cookie = 'sb-access-token=; path=/; max-age=0';
        router.push('/login');
      }
    });

    return () => {
      mounted = false;
      // unsubscribe if present — narrow the type to avoid linting `any`.
      const maybeSub = sub as unknown as { data?: { subscription?: { unsubscribe?: () => void } } };
      maybeSub.data?.subscription?.unsubscribe?.();
    };
  }, [router]);

  async function handleLogout(): Promise<void> {
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-bg-secondary p-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-accent text-center font-bold text-white">AF</div>
        <div>
          <p className="text-sm font-semibold text-text-primary">AppForgeAI</p>
          <p className="text-xs text-text-muted">Multi-stage engine</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href) ?? false;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
              } ${item.highlight ? 'font-semibold' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.Icon && <item.Icon className="h-4 w-4" aria-hidden />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-border pt-4">
        {email ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">{email}</p>
              <p className="text-xs text-text-muted">Account</p>
            </div>
            <button
              onClick={() => void handleLogout()}
              className="rounded bg-bg-primary px-3 py-1 text-sm hover:bg-bg-card flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="rounded bg-accent px-3 py-1 text-sm text-white flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Link>
            <Link href="/signup" className="rounded border border-border px-3 py-1 text-sm">Sign Up</Link>
          </div>
        )}
      </div>
    </aside>
  );
}
