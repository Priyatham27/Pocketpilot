import { type NextRequest, NextResponse } from 'next/server';

/**
 * Edge-compatible session check for Next.js middleware.
 *
 * The full @supabase/supabase-js SDK contains Node.js-specific code
 * that crashes on Vercel's Edge Runtime where middleware always runs.
 *
 * This implementation checks for Supabase session cookies directly —
 * zero SDK imports, zero edge compatibility issues, works on any runtime.
 *
 * Security: The server-side session is still verified by Supabase's RLS
 * policies on every database query. This middleware only handles redirects.
 */

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/auth/callback',
];

function hasValidSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  // Supabase @supabase/ssr stores auth tokens in cookies named:
  // sb-<project-ref>-auth-token or sb-<project-ref>-auth-token.0 etc.
  return cookies.some(
    (cookie) =>
      (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')) ||
      // Legacy @supabase/auth-helpers-nextjs format
      cookie.name === 'supabase-auth-token'
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const hasSession = hasValidSessionCookie(request);

  // Redirect unauthenticated users away from protected routes
  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Preserve the original destination for post-login redirect
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (not the callback)
  if (hasSession && isPublicRoute && pathname !== '/auth/callback') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
