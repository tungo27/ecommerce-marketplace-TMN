import { NextRequest, NextResponse } from 'next/server';

/**
 * Private routes that require authentication.
 * Users without a valid token will be redirected to /login.
 */
const PRIVATE_ROUTES = ['/profile', '/orders', '/checkout', '/account'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path matches any private route
  const isPrivateRoute = PRIVATE_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isPrivateRoute) {
    return NextResponse.next();
  }

  // Read accessToken from cookies (set during login)
  const token = request.cookies.get('accessToken')?.value;

  // No token → redirect to login, preserving intended destination
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists → allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/orders/:path*', '/checkout/:path*', '/account/:path*'],
};
