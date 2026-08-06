/**
 * Rate limiting — Redis-backed with an in-memory fallback.
 * ────────────────────────────────────────────────────────
 * Returns an express-rate-limit middleware. The store is:
 *   - Redis (shared across instances) when REDIS_URL is set
 *   - in-memory (per-process) otherwise
 *
 * A distinct store prefix is used per limiter so separate route limits
 * (auth, payments, public, ...) don't share counters.
 */

import rateLimit, { MemoryStore, Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis, isRedisEnabled } from './redis';

export type LimiterPreset = 'global' | 'auth' | 'public' | 'payment' | 'admin';

interface LimiterConfig {
  windowMs:   number;
  max:        number;
  keyByUser?: boolean;   // key by authenticated user id instead of IP
  skipAdmins?: boolean;  // admins bypass the limit (payment/admin routes)
  message?:   string;
}

const PRESETS: Record<LimiterPreset, LimiterConfig> = {
  // Global catch-all on every request
  global:   { windowMs: 60_000,  max: 200 },
  // Sign-in / sign-up / OTP — brute-force target, keep tight
  auth:     { windowMs: 60_000,  max: 20, keyByUser: true },
  // Public, unauthenticated endpoints (tracking, geocode)
  public:   { windowMs: 60_000,  max: 60 },
  // Anything that moves real money (pay, topup, withdraw, refund)
  payment:  { windowMs: 60_000,  max: 10, keyByUser: true, skipAdmins: true },
  // Admin panel — generous but still bounded
  admin:    { windowMs: 60_000,  max: 120, keyByUser: true },
};

function buildStore(preset: string): Options['store'] {
  const redis = getRedis();
  if (redis) {
    return new RedisStore({
      // rate-limit-redis v4 executes Redis commands via sendCommand
      sendCommand: (...args: string[]) => (redis as any).call(...args),
      prefix:      `rl:${preset}:`,
    });
  }
  return new MemoryStore();
}

/** Creates a limiter middleware for the given preset. */
export function createLimiter(
  preset: LimiterPreset,
  overrides: Partial<LimiterConfig> = {},
) {
  const cfg: LimiterConfig = { ...PRESETS[preset], ...overrides };

  const limiter = rateLimit({
    windowMs:   cfg.windowMs,
    limit:      cfg.max,
    standardHeaders: 'draft-7',
    legacyHeaders:   false,
    store:      buildStore(preset),
    message:    {
      error: `Too many requests. Please try again in ${Math.round(cfg.windowMs / 1000)} seconds.`,
    },
    skip:       (req) => !!cfg.skipAdmins && req.user?.role === 'ADMIN',
    keyGenerator: (req) => {
      if (cfg.keyByUser && req.user?.id) return `user:${req.user.id}`;
      return req.ip ?? 'unknown';
    },
  });

  return limiter;
}
