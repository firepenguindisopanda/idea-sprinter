import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for server-side authentication and route protection
 * 
 * This middleware runs before every request and:
 * 1. Protects authenticated routes by checking for auth_token cookie
 * 2. Redirects unauthenticated users to login page
 * 3. Allows public routes to be accessed without authentication
 */

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/success',
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/')
  );

  // Allow public routes without token check
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/generate',
    '/ideation',
    '/prd',
    '/architecture',
    '/profile',
  ];

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If route is protected and no token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    // Save the original URL to redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Configure which routes the middleware applies to
 * 
 * This matcher ensures middleware runs on:
 * - All routes under /dashboard, /generate, /ideation, /prd, /architecture, /profile
 * - Root path
 * - Auth routes
 */
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/generate/:path*',
    '/ideation/:path*',
    '/prd/:path*',
    '/architecture/:path*',
    '/profile/:path*',
    '/auth/:path*',
  ],
};
