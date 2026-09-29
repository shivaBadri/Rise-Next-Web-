// Simple in-memory sliding window limiter (per serverless instance).
// For multi-instance production use Upstash/Redis; this stops casual abuse.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now);
  buckets.set(key, arr);
  return true;
}
