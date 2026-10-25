import { cleanTransitLabel } from '../labels';
import type { RouteSummary } from '../types/route';

export function filterRoutes(
  routes: RouteSummary[] | undefined,
  query: string,
  limit = 8,
): RouteSummary[] {
  if (!routes || query.trim().length < 1) return [];
  const normalize = (value: string) =>
    cleanTransitLabel(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const q = normalize(query.trim());
  return routes
    .filter((r) => {
      const shortName = normalize(r.shortName || '');
      const longName = normalize(r.longName || '');
      const agencyName = normalize(r.agency?.name || '');
      if (q.length === 1) return shortName === q;
      return shortName.includes(q) || longName.includes(q) || agencyName.includes(q);
    })
    .sort((a, b) => {
      const rank = (route: RouteSummary) =>
        normalize(route.shortName || '') === q
          ? 0
          : normalize(route.shortName || '').startsWith(q)
            ? 1
            : 2;
      return rank(a) - rank(b);
    })
    .slice(0, limit);
}
