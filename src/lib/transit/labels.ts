export function cleanTransitLabel(
  raw: string | null | undefined,
  fallback?: string | null | undefined,
): string {
  if (!raw && !fallback) return '';
  let text = (raw || '').trim();
  text = text.replace(/<[^>]*>/g, '').trim();
  text = text.replace(/&#(x[\da-f]+|\d+);/gi, (_, dec: string) => {
    try {
      return String.fromCodePoint(
        dec[0].toLowerCase() === 'x' ? parseInt(dec.slice(1), 16) : Number(dec),
      );
    } catch {
      return '';
    }
  });
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
  if (text.length > 0) {
    return text;
  }
  if (fallback) {
    return cleanTransitLabel(fallback);
  }
  return '';
}

export function compactTransitPlaceName(text: string): string {
  return text.replace(/(^|[→⇒]\s*)Budapest\s*,\s*(?=\S)/gi, '$1');
}

export function cleanTransitPlaceName(raw: string | null | undefined, fallback?: string | null) {
  return compactTransitPlaceName(cleanTransitLabel(raw, fallback));
}
