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
  const accessToken = req.cookies.get('at')?.value;
  const isAuthenticated = !!accessToken;
  
  // If trying to access protected route without authentication
  if (!isPublicRoute && !isAuthenticated) {
    url.pathname = '/auth/login';
    // Always send to login without preserving redirect
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }
  
  // If trying to access auth pages while already authenticated
  if (isPublicRoute && isAuthenticated) {
    // Always go to home after auth
    url.pathname = '/home';
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }
  
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

