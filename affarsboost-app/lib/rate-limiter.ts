/**
 * Enkel in-memory rate limiter.
 * Används per IP — fungerar så länge appen kör på en enda process (PM2 fork mode).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Rensa utgångna poster var 10:e minut
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (now > bucket.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

/**
 * Returnerar true om requesten är tillåten, false om den ska blockeras.
 * @param key      IP-adress eller annat unikt nyckel
 * @param max      Max antal anrop per fönster
 * @param windowMs Fönsterstorlek i millisekunder (default: 1 timme)
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs = 60 * 60 * 1000
): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}

/**
 * Returnerar hur många sekunder kvar tills rate-limit nollställs.
 */
export function getRateLimitRetryAfter(key: string): number {
  const bucket = store.get(key);
  if (!bucket) return 0;
  return Math.max(0, Math.ceil((bucket.resetAt - Date.now()) / 1000));
}
