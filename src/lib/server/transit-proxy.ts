const MAV_ORIGIN = 'https://mavplusz.hu';
const TIMEOUT = 15_000;

export async function proxyTransit(
  request: Request,
  path: string[],
  search = new URL(request.url).search,
) {
  const pathname = `/${path.map(encodeURIComponent).join('/')}`;
  const isGraphql = pathname === '/otp2-backend/otp/routers/default/index/graphql';
  const isGet =
    pathname === '/photon/api' ||
    pathname === '/otp2-backend/otp/routers/default/geocode/stations' ||
    /^\/otp2-backend\/otp\/routers\/default\/index\/trips\/[^/]+\/geometry$/.test(pathname);
  if ((request.method === 'POST' && !isGraphql) || (request.method === 'GET' && !isGet)) {
    return Response.json({ errors: [{ message: 'Unknown transit endpoint' }] }, { status: 404 });
  }
  const target = new URL(pathname, MAV_ORIGIN);
  target.search = search;
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'tkterkep/1.0 (proxy)',
      },
      body: request.method === 'POST' ? await request.text() : undefined,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(TIMEOUT)]),
      cache: 'no-store',
      redirect: 'error',
    });
    // Read the body inside the timeout; slow response streams must also expire.
    const data = await upstream.text();
    if (!upstream.ok) {
      return Response.json(
        { errors: [{ message: 'Transit service is unavailable' }] },
        {
          status: upstream.status >= 500 ? 502 : upstream.status,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    }
    if (!data || !upstream.headers.get('content-type')?.includes('json')) {
      throw new Error('Invalid upstream response');
    }
    return new Response(data, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const timeout =
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return Response.json(
      {
        errors: [
          { message: timeout ? 'Transit service timed out' : 'Transit service is unavailable' },
        ],
      },
      {
        status: timeout ? 504 : 502,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
