import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Comprehensive auth guard for all protected routes
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth/login', 
    '/auth/signup', 
    '/auth/forgot-password', 
    '/auth/reset-password', 
    '/auth/verify',
    '/auth/verify-email'
  ];
  const isPublicRoute = publicRoutes.includes(url.pathname);
  
  // Check if user is authenticated
  // CRITICAL FIX: Check both cookies and headers for token
  const cookieToken = req.cookies.get('at')?.value;
  const authHeader = req.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  const isAuthenticated = !!(cookieToken || headerToken);
  
  // If trying to access protected route without authentication
  if (!isPublicRoute && !isAuthenticated) {
    url.pathname = '/auth/login';
    // Always send to login without preserving redirect
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }
  
  // CRITICAL FIX: Let client-side handle auth page redirects
  // Middleware can't reliably detect localStorage-based authentication
  // if (isPublicRoute && isAuthenticated) {
  //   url.pathname = '/home';
  //   url.searchParams.delete('redirect');
  //   return NextResponse.redirect(url);
  // }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

