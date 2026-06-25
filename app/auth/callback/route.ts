import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth Callback Route Handler
 *
 * This route is the ONLY place where:
 * - Google OAuth authorization codes are exchanged for sessions
 * - Email confirmation tokens are exchanged for sessions
 * - Password reset tokens are processed
 *
 * Supabase redirects here after any auth flow.
 * We exchange the code for a session (which sets the auth cookie),
 * then redirect the user to the appropriate page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Where to redirect after successful auth (defaults to dashboard)
  const next = searchParams.get('next') ?? '/dashboard';

  // Handle errors returned from Supabase/OAuth provider
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

  if (code) {
    const supabase = await createClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Session is now stored in cookies — redirect to dashboard
      // Use the `next` param to support custom redirect targets (e.g. password reset)
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        // In development, always use origin
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // In production behind a proxy (Vercel), use x-forwarded-host
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    console.error('Code exchange failed:', exchangeError.message);
  }

  // Something went wrong — no code or exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
