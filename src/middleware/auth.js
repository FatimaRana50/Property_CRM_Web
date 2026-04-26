import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

/**
 * Authentication Middleware
 * Verifies JWT/session tokens and protects routes
 */

export async function requireAuth(request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}

export async function requireAdmin(request) {
  const { error, session } = await requireAuth(request);

  if (error) return { error, session: null };

  if (session.user.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}

export async function requireRole(request, allowedRoles) {
  const { error, session } = await requireAuth(request);

  if (error) return { error, session: null };

  if (!allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}
