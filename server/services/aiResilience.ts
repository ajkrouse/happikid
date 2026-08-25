import crypto from "crypto";

export const AI_REQUEST_TIMEOUT_MS = 10_000;
export const AI_SUMMARY_CACHE_TTL_MS = 60_000;
export const AI_REPLY_CACHE_TTL_MS = 30_000;

const MAX_CACHE_ENTRIES = 200;

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

export class AITimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms`);
    this.name = "AITimeoutError";
  }
}

/**
 * Creates a compact key from the complete model input. Hashing keeps prompts,
 * profile data, and conversation text out of cache diagnostics and map keys.
 */
export function createAICacheKey(namespace: string, input: unknown): string {
  return `${namespace}:${crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}

/**
 * Runs one AI request at a time for an identical input, caches successful
 * responses briefly, and bounds how long callers wait on the model.
 *
 * Null responses and failures are deliberately not cached: a transient outage
 * must recover on the next request rather than becoming a sticky fallback.
 */
export async function runBoundedCachedAI<T>(
  key: string,
  operation: (signal: AbortSignal) => Promise<T>,
  options: { timeoutMs?: number; ttlMs?: number } = {},
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached) {
    if (cached.expiresAt > now) return cached.value as T;
    cache.delete(key);
  }

  const existing = inFlight.get(key);
  if (existing) return await existing as T;

  const timeoutMs = options.timeoutMs ?? AI_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const promise = withTimeout(
    Promise.resolve().then(() => operation(controller.signal)),
    timeoutMs,
    () => controller.abort(),
  );
  inFlight.set(key, promise);

  try {
    const value = await promise;
    if (value !== null && value !== undefined) {
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
      cache.set(key, {
        value,
        expiresAt: Date.now() + (options.ttlMs ?? AI_SUMMARY_CACHE_TTL_MS),
      });
    }
    return value;
  } finally {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(new AITimeoutError(timeoutMs));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Test-only reset hook; does not expose cached user content. */
export function clearAICache(): void {
  cache.clear();
  inFlight.clear();
}