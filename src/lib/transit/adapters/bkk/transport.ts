/** Shared across every client and query: no parallel bursts from map/detail polling. */
export function createBkkTransport(options?: {
  resolveApiKey: () => Promise<string | null>;
  invalidateApiKey?: () => void;
}) {
  const cache = new Map<string, { response: Response; expires: number }>();
  const pending = new Map<string, Promise<Response>>();
  let queue = Promise.resolve();
  let nextRequest = 0;
  let blockedUntil = 0;
  const transport: typeof fetch = async (input, init) => {
    const url = String(input);
    const hit = cache.get(url);
    if (hit && hit.expires > Date.now()) return hit.response.clone();
    const existing = pending.get(url);
    if (existing) return (await existing).clone();
    const interactive =
      /\/(trip-details|vehicle-for-trip|arrivals-and-departures-for-stop|schedule-for-stop)\?/.test(
        url,
      );
    if (pending.size >= (interactive ? 12 : 4)) throw new Error('BKK request queue busy');
    if (Date.now() < blockedUntil) throw new Error('BKK temporarily rate limited');
    const request = queue.then(async () => {
      if (Date.now() < blockedUntil) throw new Error('BKK temporarily rate limited');
      const wait = nextRequest - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      nextRequest = Date.now() + 1_100;
      const key = await options?.resolveApiKey();
      let target = input;
      if (key) {
        const authenticated = new URL(url);
        authenticated.searchParams.set('key', key);
        target = authenticated.toString();
      }
      const response = await fetch(target, { ...init, signal: AbortSignal.timeout(15_000) });
      if (response.status === 401 || response.status === 403) options?.invalidateApiKey?.();
      const body = await response.text();
      let data: { status?: string; code?: number };
      try {
        data = JSON.parse(body);
      } catch {
        throw new Error('Invalid BKK response');
      }
      if (response.status === 429 || data.status === 'LIMIT_EXCEEDED') {
        const retry = Number(response.headers.get('retry-after'));
        blockedUntil = Date.now() + Math.max(60_000, Number.isFinite(retry) ? retry * 1000 : 0);
        throw new Error('BKK temporarily rate limited');
      }
      if (!response.ok || data.status !== 'OK') throw new Error('BKK service unavailable');
      const result = new Response(body, { headers: { 'Content-Type': 'application/json' } });
      const ttl = /route-details|schedule-for-stop/.test(url) ? 300_000 : 15_000;
      cache.set(url, { response: result, expires: Date.now() + ttl });
      // Bound memory even after exploring many map areas and stops.
      for (const [key, value] of cache) if (value.expires < Date.now()) cache.delete(key);
      if (cache.size > 64) cache.delete(cache.keys().next().value!);
      return result;
    });
    queue = request.then(
      () => {},
      () => {},
    );
    pending.set(url, request);
    try {
      return (await request).clone();
    } finally {
      pending.delete(url);
    }
  };
  return transport;
}
