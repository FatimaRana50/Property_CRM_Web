import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin-only routes
    if (
      (pathname.startsWith('/dashboard/admin') ||
        pathname.startsWith('/dashboard/analytics') ||
        pathname.startsWith('/dashboard/agents')) &&
      token?.role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/dashboard/agent', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
