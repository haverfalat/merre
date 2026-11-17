import { cleanTransitLabel } from './transit/labels';

/** Separate the metro pictogram from its line number without changing route data. */
export function metroLineNumber(label?: string | null, mode?: string | null): string | null {
  if (mode !== 'SUBWAY') return null;
  return /^(?:M\s*)?([1-4])$/i.exec(cleanTransitLabel(label))?.[1] ?? null;
}
