/**
 * Rate limiting middleware for API routes
 * Prevents brute force attacks, spam, and abuse
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
// For production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom message to return when rate limit is exceeded
   */
  message?: string;

  /**
   * Custom key generator function
   * Defaults to using IP address
   */
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * Default configurations for common endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - strict limits
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  // Password reset - very strict
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset attempts. Please try again in 1 hour.',
  },
  // Score submission - moderate limits
  scoreSubmission: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many score submissions. Please slow down.',
  },
  // General API - lenient limits
  general: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again later.',
  },
} as const;

/**
 * Get client identifier from request
 * Uses IP address, or forwarded IP if behind proxy
 */
function getClientIdentifier(request: NextRequest): string {
  // Check for forwarded IP (when behind proxy like Vercel, Cloudflare)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP if multiple
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header (Cloudflare, nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP
  const ip = request.ip;
  if (ip) {
    return ip;
  }

  // Ultimate fallback (shouldn't happen in production)
  return 'unknown';
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or NextResponse with 429 status if rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const now = Date.now();

  // Get client identifier
  const keyGenerator = config.keyGenerator || getClientIdentifier;
  const clientKey = keyGenerator(request);

  // Get or create rate limit entry
  let entry = rateLimitStore.get(clientKey);

  if (!entry || now > entry.resetTime) {
    // First request or window expired - create new entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(clientKey, entry);
    return null; // Allow request
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // seconds

    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }

  // Update entry
  rateLimitStore.set(clientKey, entry);

  // Allow request
  return null;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = checkRateLimit(request, config);

    if (rateLimitResponse) {
      // Rate limit exceeded
      return rateLimitResponse;
    }

    // Continue to handler
    return handler(request);
  };
}

/**
 * Get current rate limit status for a client (for debugging)
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig
): {
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const clientKey = getClientIdentifier(request);
  const entry = rateLimitStore.get(clientKey);

  if (!entry || Date.now() > entry.resetTime) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Clear rate limit for a specific client (admin function)
 */
export function clearRateLimit(clientKey: string): void {
  rateLimitStore.delete(clientKey);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
