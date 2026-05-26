// Simple in-memory rate limiter using Map
// Upgrade to Upstash Redis when UPSTASH_REDIS_REST_URL is configured
const LIMITS: Record<string, number[]> = {};

export function rateLimit(key: string, maxRequests = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!LIMITS[key]) LIMITS[key] = [];

  // Remove old entries
  LIMITS[key] = LIMITS[key].filter(t => t > windowStart);

  if (LIMITS[key].length >= maxRequests) return false;

  LIMITS[key].push(now);
  return true;
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
  });
}
