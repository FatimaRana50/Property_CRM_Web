import { NextResponse } from 'next/server';

/**
 * Rate Limiting Middleware
 * - Agents: 50 requests per minute
 * - Admins: No limit (or very high)
 */

const rateLimitMap = new Map();

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > 60000) {
      rateLimitMap.delete(key);
    }
  }
}

export function rateLimit(identifier, role = 'agent') {
  // Admins have no rate limit
  if (role === 'admin') return null;

  const limit = 50; // 50 requests per minute for agents
  const windowMs = 60 * 1000; // 1 minute

  cleanupOldEntries();

  const now = Date.now();
  const key = identifier;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return null;
  }

  const data = rateLimitMap.get(key);

  if (now - data.windowStart > windowMs) {
    // Reset window
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return null;
  }

  data.count++;

  if (data.count > limit) {
    const resetTime = Math.ceil((data.windowStart + windowMs - now) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetTime} seconds`,
        retryAfter: resetTime,
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetTime.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null;
}
