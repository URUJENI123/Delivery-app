/**
 * Redis connection — OPTIONAL.
 * ──────────────────────────
 * Used for:
 *   1. Shared rate-limit store (across backend instances)
 *   2. Shared cache (provider tokens, tracking, dashboard, ranked couriers)
 *   3. Socket.IO pub/sub adapter (cross-instance broadcasts)
 *
 * If REDIS_URL is not set, every consumer gracefully falls back to an
 * in-memory implementation — the app runs fine on a single instance
 * without any external infrastructure.
 */

import Redis from 'ioredis';

let _redis: Redis | null = null;

export function redisUrl(): string | null {
  return process.env.REDIS_URL || null;
}

export function isRedisEnabled(): boolean {
  return redisUrl() !== null;
}

/** Returns the shared Redis client, or null when REDIS_URL is not set. */
export function getRedis(): Redis | null {
  const url = redisUrl();
  if (!url) return null;

  if (!_redis) {
    _redis = new Redis(url, {
      lazyConnect:    false,
      maxRetriesPerRequest: 2,
      enableOfflineQueue:   false,
      retryStrategy:        (times) => Math.min(times * 200, 2000),
    });

    _redis.on('error', (err) => {
      console.warn(`[Redis] connection error: ${err.message}`);
    });
    _redis.on('connect', () => console.log('[Redis] connected'));
  }

  return _redis;
}

/** Best-effort Redis command wrapper — never throws to the caller. */
export async function redisSafe<T>(fn: (redis: Redis) => Promise<T>, fallback: T): Promise<T> {
  try {
    const redis = getRedis();
    if (!redis) return fallback;
    return await fn(redis);
  } catch (err) {
    console.warn(`[Redis] operation failed: ${(err as Error).message}`);
    return fallback;
  }
}
