import { normalizeSearchText } from '@/lib/search-relevance';
import { cleanTransitLabel, cleanTransitPlaceName } from '../labels';
import type { RouteDetail, RoutePattern, RouteSummary } from '../types/route';

export interface CompoundRouteQuery {
  routes: RouteSummary[];
  restTokens: string[];
  stopQuery: string;
}

export interface CompoundRouteStopMatch {
  route: RouteDetail;
  pattern: RoutePattern;
  stop: NonNullable<RoutePattern['stops']>[number];
  stopId: string;
  headsign: string;
  score: number;
}

export function parseCompoundRouteQuery(
  query: string,
  routes: RouteSummary[] | undefined,
): CompoundRouteQuery | null {
  if (!routes?.length) return null;
  const tokens = normalizeSearchText(query).split(' ').filter(Boolean);
  if (tokens.length < 2) return null;

  const findExact = (candidate: string) =>
    routes.filter((r) => normalizeSearchText(cleanTransitLabel(r.shortName || '')) === candidate);

  let matched: RouteSummary[] = [];
  let restTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const hits = findExact(tokens[i]);
    if (hits.length) {
      matched = hits;
      restTokens = tokens.filter((_, idx) => idx !== i);
      break;
    }
    if (i + 1 < tokens.length && tokens.length >= 3) {
      const pairHits = findExact(`${tokens[i]}${tokens[i + 1]}`);
      if (pairHits.length) {
        matched = pairHits;
        restTokens = tokens.filter((_, idx) => idx !== i && idx !== i + 1);
        break;
      }
    }
  }

  restTokens = restTokens.filter((t) => t.length >= 2);
  if (!matched.length || !restTokens.length) return null;

  const sorted = [...matched].sort((a, b) => {
    const score = (r: RouteSummary) =>
      (/^BKK[:_]/.test(r.id) ? 4 : 0) +
      (r.mode === 'SUBWAY' || r.mode === 'TRAM' || r.mode === 'TROLLEYBUS' || r.mode === 'BUS' ? 2 : 0);
    return score(b) - score(a);
  });

  return {
    routes: sorted.slice(0, 3),
    restTokens,
    stopQuery: restTokens.join(' '),
  };
}

function tokenMatchScore(text: string, token: string): number {
  if (!text || !token) return 0;
  if (text === token) return 400;
  const words = text.split(/[\s,./-]+/).filter(Boolean);
  if (words.some((w) => w === token)) return 300;
  if (words.some((w) => w.startsWith(token))) return 220;
  if (text.includes(token)) return 140;
  return 0;
}

export function matchCompoundRouteStops(
  routeDetails: (RouteDetail | null | undefined)[],
  restTokens: string[],
): CompoundRouteStopMatch[] {
  if (!restTokens.length) return [];
  const seen = new Set<string>();
  const matches: CompoundRouteStopMatch[] = [];

  for (const route of routeDetails) {
    if (!route?.patterns?.length) continue;
    for (const pattern of route.patterns) {
      const headsign = cleanTransitPlaceName(
        pattern.headsign || pattern.stops?.at(-1)?.name || '',
      );
      const normHeadsign = normalizeSearchText(headsign);

      for (const stop of pattern.stops ?? []) {
        const stopId = stop.gtfsId || stop.id;
        if (!stopId || !stop.name) continue;
        const normStop = normalizeSearchText(stop.name);

        let stopScore = 0;
        let headsignScore = 0;
        let allMatched = true;

        for (const token of restTokens) {
          const s = tokenMatchScore(normStop, token);
          const h = tokenMatchScore(normHeadsign, token);
          if (s === 0 && h === 0) {
            allMatched = false;
            break;
          }
          if (s >= h) stopScore += s;
          else headsignScore += h;
        }

        if (!allMatched || stopScore === 0) continue;

        const key = `${route.id}|${normStop}|${normHeadsign}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const directionBoost = headsignScore > 0 ? 1200 : 0;
        matches.push({
          route,
          pattern,
          stop,
          stopId,
          headsign,
          score: 1800 + stopScore + headsignScore + directionBoost,
        });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
