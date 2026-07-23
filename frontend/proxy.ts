import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── DEV MODE ──────────────────────────────────────────────────────────────────
// When NEXT_PUBLIC_DEV_MOCK=true all auth checks are skipped.
// The frontend mock (lib/api.ts) handles data; no backend needed.
const DEV_MOCK = process.env.NEXT_PUBLIC_DEV_MOCK === 'true';

const publicRoutes = [
  '/',
  '/auth',
  '/auth/signin',
  '/auth/signup',
  '/auth/sender/signin',
  '/auth/sender/signup',
  '/auth/sender/forgot-password',
  '/auth/sender/reset-password',
  '/auth/courier',
  '/auth/courier/verify',
  '/auth/courier/onboarding',
  '/auth/courier/pending',
  '/auth/callback',
  '/login',
  '/track',
  '/support',
  '/terms',
  '/privacy',
];

const authRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/sender/signin',
  '/auth/sender/signup',
  '/auth/sender/forgot-password',
  '/auth/sender/reset-password',
  '/auth/courier',
  '/auth/courier/verify',
  '/auth/courier/onboarding',
];

const roleDashboards: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  COURIER: '/courier/dashboard',
  SENDER: '/sender/dashboard',
};

async function fetchUser(token: string, apiUrl: string) {
  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

function isAuthRoute(pathname: string) {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // DEV MODE: skip all auth middleware — let the client handle everything
  if (DEV_MOCK) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('access_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    if (isPublicRoute(pathname) || pathname.startsWith('/admin/auth')) {
      return NextResponse.next();
    }
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  if (isAuthRoute(pathname)) {
    const user = await fetchUser(token, apiUrl);
    if (user?.role) {
      const dashboard = roleDashboards[user.role];
      if (dashboard) return NextResponse.redirect(new URL(dashboard, request.url));
    }
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/auth')) {
    const user = await fetchUser(token, apiUrl);
    if (!user || user.role !== 'ADMIN') {
      const loginUrl = new URL('/admin/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/sender')) {
    const user = await fetchUser(token, apiUrl);
    if (!user) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'SENDER') {
      return NextResponse.redirect(new URL(roleDashboards[user.role] || '/auth', request.url));
    }
  }

  if (pathname.startsWith('/courier')) {
    const user = await fetchUser(token, apiUrl);
    if (!user) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'COURIER') {
      return NextResponse.redirect(new URL(roleDashboards[user.role] || '/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
