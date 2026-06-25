import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase browser client for use in 'use client' components.
 * Uses @supabase/ssr's createBrowserClient which manages cookies automatically.
 *
 * Provides safe fallbacks during Next.js build-time static generation
 * (env vars are not available in the build sandbox without .env.local).
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
