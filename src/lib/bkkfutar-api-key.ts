const SOURCE = 'https://go.bkk.hu/';
const FRESH_FOR = 60 * 60_000;
let cached: { key: string; expires: number } | undefined;
let pending: Promise<string> | undefined;
let retryAfter = 0;

/** Read the public web client's configuration; never execute its scripts. */
export function parseBkkFutarApiKey(html: string): string {
  const config = html.match(/<script\b[^>]*\bid\s*=\s*["']APP_CONFIG["'][^>]*>([\s\S]*?)<\/script\s*>/i)?.[1];
  const key = config?.match(/["']API_KEY["']\s*:\s*["'](web-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/i)?.[1];
  if (!key) throw new Error('BKK web API key is unavailable');
  return key;
}

/** Fetch, rather than invent, the key issued by go.bkk.hu. Concurrent callers share one request. */
export function generateBkkFutarApiKey(): Promise<string> {
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.key);
  if (pending) return pending;
  if (Date.now() < retryAfter) return Promise.reject(new Error('BKK web API key is temporarily unavailable'));
  pending = (async () => {
    try {
      const response = await fetch(SOURCE, { signal: AbortSignal.timeout(10_000), headers: { Accept: 'text/html' } });
      if (!response.ok) throw new Error('BKK web configuration is unavailable');
      const key = parseBkkFutarApiKey(await response.text());
      cached = { key, expires: Date.now() + FRESH_FOR };
      return key;
    } catch (error) {
      retryAfter = Date.now() + 30_000;
      throw error;
    } finally {
      pending = undefined;
    }
  })();
  return pending;
}

export function invalidateBkkFutarApiKey() {
  cached = undefined;
}
