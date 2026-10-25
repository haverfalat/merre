import { proxyTransit } from '@/lib/server/transit-proxy';

function proxy(request: Request, { path }: { path: string }) {
  return proxyTransit(request, path.split('/'));
}
export const GET = proxy;
export const POST = proxy;
