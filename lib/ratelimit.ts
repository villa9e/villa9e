// Rate limiting — uses Upstash Redis when configured, falls back to in-memory
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel for persistent limits

let redis: any = null;

async function getRedis() {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// In-memory fallback (resets on cold start — not reliable for production)
const MEM: Record<string, number[]> = {};

export async function rateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000
): Promise<boolean> {
  const r = await getRedis();

  if (r) {
    // Upstash Redis sliding window
    const windowSec = Math.ceil(windowMs / 1000);
    const redisKey  = `rl:${key}`;
    const now       = Date.now();

    const pipeline = r.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, now - windowMs);
    pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
    pipeline.zcard(redisKey);
    pipeline.expire(redisKey, windowSec);

    const results = await pipeline.exec();
    const count   = results[2] as number;
    return count <= maxRequests;
  }

  // In-memory fallback
  const now         = Date.now();
  const windowStart = now - windowMs;
  if (!MEM[key]) MEM[key] = [];
  MEM[key] = MEM[key].filter(t => t > windowStart);
  if (MEM[key].length >= maxRequests) return false;
  MEM[key].push(now);
  return true;
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
  );
}
