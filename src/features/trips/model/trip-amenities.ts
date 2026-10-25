import type { InfoService } from '@/lib/transit/types/stop';

export function amenitySymbol(service: InfoService): string | undefined {
  const supported = !service.fontCharSet || service.fontCharSet.trim().toUpperCase() === 'MNR2007';
  const code = service.fontCode;
  return supported &&
    Number.isInteger(code) &&
    code > 32 &&
    code <= 0x10ffff &&
    !(code >= 0xd800 && code <= 0xdfff)
    ? String.fromCodePoint(code)
    : undefined;
}
