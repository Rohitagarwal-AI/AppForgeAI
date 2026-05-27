import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client suitable for server-side usage. Uses the
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY when a
 * service role key is not available.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = (process.env.SUPABASE_SERVICE_ROLE_KEY as string) ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

  return createClient(url ?? '', anon ?? '');
}
