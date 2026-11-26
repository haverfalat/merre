// ActivityKit requires an APNs start event when the first match happens on a locked phone.
import { createPrivateKey, sign } from 'node:crypto';
import { connect } from 'node:http2';
import type { RideDisplay } from '~/features/rides/activity.ios';

const recent = new Map<string, number>();
let authorization: { token: string; created: number } | undefined;

function providerToken(team: string, keyId: string, pem: string, now: number) {
  if (authorization && now - authorization.created < 2400) return authorization.token;
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const data = encode({ alg: 'ES256', kid: keyId }) + '.' + encode({ iss: team, iat: now });
  const signature = sign('sha256', Buffer.from(data), {
    key: createPrivateKey(pem.replace(/\\n/g, '\n')), dsaEncoding: 'ieee-p1363',
  });
  authorization = { token: data + '.' + signature.toString('base64url'), created: now };
  return authorization.token;
}
function validDisplay(d: Partial<RideDisplay> | null): d is RideDisplay {
  const label = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;
  return !!d && label(d.route, 64) && label(d.destination, 200) && label(d.status, 64) &&
    label(d.nextTime, 8) && /^#[0-9a-f]{6}$/i.test(d.color ?? '') && /^#[0-9a-f]{6}$/i.test(d.ink ?? '') &&
    /^[a-z.]{1,40}$/.test(d.symbol ?? '') && Array.isArray(d.rows) && d.rows.length > 0 && d.rows.length <= 4 &&
    d.rows.every(r => r && label(r.time, 8) && label(r.name, 200) && label(r.delay, 64));
}
export async function POST(request: Request) {
  const team = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const pem = process.env.APNS_PRIVATE_KEY;
  if (!team || !keyId || !pem) return new Response(null, { status: 503 });
  const body = await request.json().catch(() => null);
  if (typeof body?.token !== 'string' || !/^[a-f\d]{32,256}$/i.test(body.token) || !validDisplay(body.display)) {
    return new Response(null, { status: 400 });
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({ aps: {
    timestamp: now, event: 'start', 'attributes-type': 'LiveActivityAttributes', attributes: {},
    'content-state': { name: 'TransitRide', props: JSON.stringify(body.display) },
    'stale-date': now + 120, alert: { title: 'Merre', body: body.display.route + ' → ' + body.display.destination },
  } });
  if (Buffer.byteLength(payload) > 4096) return new Response(null, { status: 413 });
  for (const [token, expires] of recent) if (expires <= now) recent.delete(token);
  if (recent.has(body.token) || recent.size >= 2048) return new Response(null, { status: 429 });
  recent.set(body.token, now + 45);
  const host = process.env.APNS_ENVIRONMENT === 'sandbox' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';
  try {
    const bearer = providerToken(team, keyId, pem, now);
    const status = await new Promise<number>((resolve, reject) => {
      const client = connect('https://' + host);
      client.on('error', reject);
      client.setTimeout(7000, () => client.destroy(new Error('APNs timeout')));
      const stream = client.request({
        ':method': 'POST', ':path': '/3/device/' + body.token, authorization: 'bearer ' + bearer,
        'apns-topic': 'hu.tkterkep.app.push-type.liveactivity', 'apns-push-type': 'liveactivity',
        'apns-priority': '10', 'apns-expiration': '0',
      });
      let code = 502;
      stream.on('response', headers => { code = Number(headers[':status']); });
      stream.on('error', reject);
      stream.on('close', () => { client.close(); resolve(code); });
      stream.resume();
      stream.end(payload);
    });
    return new Response(null, { status: status === 200 ? 202 : 502 });
  } catch {
    return new Response(null, { status: 502 });
  }
}
