import { createBkkTransport } from '@/lib/transit/adapters/bkk/transport';
import { generateBkkFutarApiKey, invalidateBkkFutarApiKey } from '@/lib/bkkfutar-api-key';
const sharedFetch = createBkkTransport({ resolveApiKey: generateBkkFutarApiKey, invalidateApiKey: invalidateBkkFutarApiKey });
const endpoints = new Set([
  'vehicles-for-location', 'vehicles-for-route', 'vehicles-for-stop', 'vehicle-for-trip',
  'search', 'trip-details', 'arrivals-and-departures-for-stop', 'schedule-for-stop', 'route-details',
]);
export async function GET(request: Request, { path }: { path: string }) {
  if (!/^otp\/api\/where\/[^/]+$/.test(path) || !endpoints.has(path.split('/').at(-1)!))
    return Response.json({ status: 'NOT_FOUND' }, { status: 404 });
  const incoming = new URL(request.url);
  const target = new URL(`https://futar.bkk.hu/api/query/v1/ws/${path}`);
  target.search = incoming.search;
  target.searchParams.delete('key');
  try {
    const upstream = await sharedFetch(target.toString(), {
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
      redirect: 'error',
    });
    const body = await upstream.text();
    return new Response(body, { status: upstream.status, headers: {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      ...(upstream.headers.has('retry-after') ? { 'Retry-After': upstream.headers.get('retry-after')! } : {}),
    } });
  } catch (error) {
    if (error instanceof Error && error.message.includes('rate limited'))
      return Response.json({ status: 'LIMIT_EXCEEDED' }, { status: 429, headers: { 'Retry-After': '60' } });
    return Response.json({ status: 'UNAVAILABLE' }, { status: 502 });
  }
}
