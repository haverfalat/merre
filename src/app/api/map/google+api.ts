import { proxyGoogleTile } from '@/lib/server/google-tile-proxy';

export function GET(request: Request) {
  return proxyGoogleTile(request);
}
