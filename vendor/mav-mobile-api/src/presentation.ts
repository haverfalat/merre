import { MavMobileError } from './errors.js';
import type { TicketImage } from './types.js';

export function ticketImageDataUri(image: TicketImage): string {
  if (typeof image.Jegykep !== 'string')
    throw new MavMobileError('protocol', 'MAV did not return a ticket image');
  const base64 = image.Jegykep.replace(/^data:image\/png;base64,/i, '').replace(/\s/g, '');
  if (
    !base64.startsWith('iVBORw0KGgo') ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) ||
    base64.length % 4 !== 0
  )
    throw new MavMobileError('protocol', 'MAV returned an unsupported ticket image');
  return `data:image/png;base64,${base64}`;
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  );

export function renderTicketImages(images: readonly TicketImage[], title: string): string {
  if (!images.length) throw new MavMobileError('unavailable', 'MAV returned no ticket images');
  const pages = images
    .map((image) => `<img src="${ticketImageDataUri(image)}" alt="${escapeHtml(title)}">`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><title>${escapeHtml(title)}</title><style>html,body{margin:0;background:#fff;color:#111}main{max-width:900px;margin:auto;padding:44px 0 12px}img{display:block;width:100%;height:auto;margin:0 auto 12px}</style></head><body><main>${pages}</main></body></html>`;
}
