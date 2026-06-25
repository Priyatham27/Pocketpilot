'use client';

import React, { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

/**
 * AuthGate — Client-side auth state listener.
 *
 * Responsibilities:
 * - Listen for Supabase auth state changes (sign in / sign out)
 * - Trigger fetchUserData() when a session becomes available
 * - Trigger clearUserData() when user signs out
 *
 * Route protection and redirects are handled by middleware.ts.
 * This component does NOT perform any redirects.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const fetchUserData = useAppStore((state) => state.fetchUserData);
  const clearUserData = useAppStore((state) => state.clearUserData);

  useEffect(() => {
    const supabase = createClient();

    // Initial session check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData();
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          fetchUserData();
        }
      } else if (event === 'SIGNED_OUT') {
        clearUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, clearUserData]);

  // Render children immediately — middleware guards protected routes
  return <>{children}</>;
}
