import { cleanTransitLabel } from './labels';

// Only explicit leading service notices are metadata. Unknown prefixes stay intact.
const NOTICES = /^(?:\[\s*)?(kocsisz[ií]nbe|gar[aá]zsmenet|pr[oó]bamenet|tanul[oó]j[aá]rat)(?:\s*\])?(?=$|[\s:–—-])/iu;
export function parseTransitHeadsign(raw: string | null | undefined) {
  let destination = cleanTransitLabel(raw);
  const notices: string[] = [];
  for (;;) {
    const match = NOTICES.exec(destination);
    if (!match) break;
    notices.push(match[1]);
    destination = destination.slice(match[0].length).replace(/^[\s:–—-]+/u, '');
  }
  return { destination, notices };
}
