import { cleanTransitLabel } from '@/lib/transit/labels';

export function transitLabelParts(html: string): { text: string; mnr: boolean }[] {
  const parts: { text: string; mnr: boolean }[] = [];
  const stack: { tag: string; mnr: boolean }[] = [];
  for (const token of html.split(/(<[^>]*>)/g)) {
    if (!token) continue;
    if (token.startsWith('<') && token.endsWith('>')) {
      const closing = token.match(/^<\/\s*([\w-]+)/);
      if (closing) {
        const index = stack.findLastIndex((entry) => entry.tag === closing[1].toLowerCase());
        if (index >= 0) stack.splice(index);
      } else {
        const tag = token.match(/^<\s*([\w-]+)/)?.[1].toLowerCase();
        if (tag && !/^(br|hr|img|input|meta|link)$/.test(tag) && !token.endsWith('/>')) {
          const classes = token.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
          const mnr = (classes?.[1] ?? classes?.[2] ?? classes?.[3] ?? '')
            .split(/\s+/)
            .some((name) => name.toUpperCase() === 'MNR2007');
          stack.push({ tag, mnr: mnr || !!stack.at(-1)?.mnr });
        }
      }
      continue;
    }
    // Sentinel characters retain spaces between mixed symbol and ordinary text runs.
    const text = cleanTransitLabel(`\u200b${token}\u200b`).slice(1, -1);
    parts.push({ text, mnr: !!stack.at(-1)?.mnr });
  }
  return parts;
}

export function displayTransitParts(html: string, placeName = false) {
  const parts = transitLabelParts(html);
  let remaining = placeName
    ? (parts
        .map((part) => part.text)
        .join('')
        .match(/^\s*Budapest\s*,\s*(?=\S)/i)?.[0].length ?? 0)
    : 0;
  return parts.map((part) => {
    const removed = Math.min(remaining, part.text.length);
    remaining -= removed;
    return { ...part, text: part.text.slice(removed) };
  });
}
