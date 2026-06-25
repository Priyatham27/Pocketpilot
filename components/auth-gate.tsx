'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Compass, Loader2 } from 'lucide-react';

const authRoutes = ['/login', '/register', '/forgot-password'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUserData = useAppStore((state) => state.fetchUserData);
  const clearUserData = useAppStore((state) => state.clearUserData);

  useEffect(() => {
    let mounted = true;

    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (mounted) {
            setIsAuthenticated(true);
            await fetchUserData();
          }
        } else {
          if (mounted) {
            setIsAuthenticated(false);
            clearUserData();
          }
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (mounted) {
          setIsAuthenticated(true);
          setLoading(true);
          await fetchUserData();
          setLoading(false);
        }
      } else {
        if (mounted) {
          setIsAuthenticated(false);
          clearUserData();
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, clearUserData]);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = authRoutes.includes(pathname);

    if (isAuthenticated) {
      if (isAuthRoute) {
        router.push('/');
      }
    } else {
      if (!isAuthRoute) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Loading Screen matching the visual aesthetic
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-radial from-slate-900 via-indigo-950 to-slate-950 p-4 text-white">
        <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6 animate-pulse">
          <Compass className="h-8 w-8 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            PocketPilot is securing your session...
          </span>
        </div>
      </div>
    );
  }

  const isAuthRoute = authRoutes.includes(pathname);

  // Prevent flash of private content if not authenticated
  if (!isAuthenticated && !isAuthRoute) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
