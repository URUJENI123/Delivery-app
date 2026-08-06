/**
 * Shared cache — Redis with an in-memory fallback.
 * ─────────────────────────────────────────────────
 * - When REDIS_URL is set: values are stored in Redis (shared across instances).
 * - Otherwise: values are stored in a simple in-memory Map (per-process).
 *
 * All operations are best-effort — if Redis is unreachable we degrade to the
 * in-memory store / recompute rather than failing the request.
 */

import { getRedis, isRedisEnabled, redisSafe } from './redis';

// ─── In-memory fallback store ─────────────────────────────────────────────────

interface MemEntry { value: string; expiresAt: number }
const mem = new Map<string, MemEntry>();
const MEM_MAX_ENTRIES = 5000;

function memGet(key: string): string | null {
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    mem.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  // Evict expired entries + keep the map bounded
  if (mem.size >= MEM_MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of mem) {
      if (v.expiresAt <= now) mem.delete(k);
    }
    // Still over the cap — drop the oldest inserted key
    if (mem.size >= MEM_MAX_ENTRIES) {
      const first = mem.keys().next();
      if (!first.done) mem.delete(first.value);
    }
  }
  mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDel(key: string): void { mem.delete(key); }

// ─── Public API ───────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isRedisEnabled()) {
    const raw = await redisSafe(
      (r) => r.get(key),
      null,
    );
    if (raw !== null && raw !== undefined) {
      try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
    }
    // Miss on Redis — check the in-memory store too (single-flight local reads)
    const local = memGet(key);
    return local ? (safeParse(local) as T) : null;
  }
  const local = memGet(key);
  return local ? (safeParse(local) as T) : null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (isRedisEnabled()) {
    await redisSafe((r) => r.set(key, serialized, 'EX', ttlSeconds), undefined);
  }
  memSet(key, serialized, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  if (isRedisEnabled()) {
    await redisSafe((r) => r.del(key), 0);
  }
  memDel(key);
}

/** Deletes every key starting with `prefix` (e.g. 'delivery:'). */
export async function cacheDelByPrefix(prefix: string): Promise<void> {
  memDelByPrefix(prefix);
  if (isRedisEnabled()) {
    await redisSafe(async (r) => {
      const keys = await r.keys(`${prefix}*`);
      if (keys.length) await r.del(...keys);
      return undefined;
    }, undefined);
  }
}

/**
 * Cache-aside helper: returns the cached value, or computes it, stores it and
 * returns it. `ttlSeconds <= 0` means never cache.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  if (ttlSeconds > 0) {
    const cached = await cacheGet<T>(key);
    if (cached !== null) return cached;
  }

  const value = await compute();

  if (ttlSeconds > 0) {
    // Don't await the write — never slow down the hot path
    cacheSet(key, value, ttlSeconds).catch(() => {});
  }
  return value;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeParse(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return raw; }
}

function memDelByPrefix(prefix: string): void {
  for (const key of mem.keys()) {
    if (key.startsWith(prefix)) mem.delete(key);
  }
}
