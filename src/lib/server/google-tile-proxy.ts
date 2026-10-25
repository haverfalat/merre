const STYLES = new Set(['m', 's', 'y', 'p']);
const errorHeaders = { 'Cache-Control': 'no-store' };

// Same-origin tile delivery lets WebGL use the image without depending on the
// undocumented upstream endpoint's browser CORS headers. No arbitrary URLs.
export async function proxyGoogleTile(request: Request, query = new URL(request.url).searchParams) {
  const style = query.get('style') ?? '';
  const values = ['z', 'x', 'y'].map((key) => query.get(key));
  if (!STYLES.has(style) || values.some((value) => value === null || !/^\d{1,10}$/.test(value))) {
    return Response.json({ error: 'Invalid map tile' }, { status: 400, headers: errorHeaders });
  }
  const [z, x, y] = values.map(Number);
  if (z > 19 || x >= 2 ** z || y >= 2 ** z) {
    return Response.json(
      { error: 'Invalid map coordinates' },
      { status: 400, headers: errorHeaders },
    );
  }
  const target = new URL('https://mt1.google.com/vt');
  target.search = new URLSearchParams({
    lyrs: style,
    x: String(x),
    y: String(y),
    z: String(z),
    hl: 'hu',
  }).toString();
  try {
    const upstream = await fetch(target, {
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
      redirect: 'error',
      cache: 'no-store',
      headers: {
        Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    const contentType = upstream.headers.get('content-type')?.split(';')[0];
    if (
      !upstream.ok ||
      !contentType ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(contentType)
    ) {
      const blocked = upstream.status === 403 || upstream.status === 429;
      return Response.json(
        {
          error: blocked
            ? 'Google is blocking map tile requests. Please choose another basemap or try again later.'
            : 'Google map tile unavailable',
        },
        {
          status: blocked ? upstream.status : 502,
          headers: errorHeaders,
        },
      );
    }
    const image = await upstream.arrayBuffer();
    if (!image.byteLength || image.byteLength > 2_000_000) {
      return Response.json({ error: 'Invalid map image' }, { status: 502, headers: errorHeaders });
    }
    return new Response(image, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': upstream.headers.get('cache-control') ?? 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const timeout =
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return Response.json(
      { error: timeout ? 'Map tile timed out' : 'Map tile unavailable' },
      { status: timeout ? 504 : 502, headers: errorHeaders },
    );
  }
}
