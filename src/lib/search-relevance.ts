import type { BoundingBox } from '@/store/useMapStore';
import { cleanTransitPlaceName } from '@/lib/transit/labels';
import { validCoordinates } from './transit';

export type SearchCandidate = {
  key: string;
  section: string;
  searchName?: string;
  routeName?: string | null;
  serviceName?: string | null;
  live?: boolean;
  position?: [number, number];
  nearby?: boolean;
};

function normalize(value: string) {
  return cleanTransitPlaceName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function insideViewport(position: [number, number], bounds: BoundingBox | null) {
  return (
    !!bounds &&
    validCoordinates(...position) &&
    position[0] >= bounds.swLon &&
    position[0] <= bounds.neLon &&
    position[1] >= bounds.swLat &&
    position[1] <= bounds.neLat
  );
}

export function rankSearchResults<T extends SearchCandidate>(
  items: T[],
  query: string,
  context: { bounds: BoundingBox | null; center: [number, number] },
) {
  const q = normalize(query);
  if (!q) return [];
  const routeQuery = /^[a-z]{0,3}\d+[a-z]{0,3}$/i.test(q);
  const score = (item: T) => {
    const name = normalize(item.searchName ?? '');
    const route = normalize(item.routeName ?? '');
    let relevance =
      name === q
        ? 700
        : name.startsWith(q)
          ? 400
          : name.split(/\s+/).some((word) => word === q)
            ? 300
            : name.includes(q)
              ? 150
              : 0;
    if (route)
      relevance = Math.max(
        relevance,
        route === q ? 1100 : route.startsWith(q) ? 500 : route.includes(q) ? 180 : 0,
      );
    if (routeQuery && route === q) relevance += 300;
    const service = normalize(item.serviceName ?? '');
    if (service === q) relevance += 1800;
    else if (service.split(/\s+/).some(word => word === q)) relevance += 1200;
    if (item.live && item.section === 'active_trips') relevance += service === q ? 1500 : 400;
    if (item.nearby) relevance += 450;
    if (item.position && validCoordinates(...item.position)) {
      if (insideViewport(item.position, context.bounds)) relevance += 300;
      const [lon, lat] = item.position;
      const distance =
        Math.hypot(
          (lon - context.center[0]) * Math.cos((context.center[1] * Math.PI) / 180),
          lat - context.center[1],
        ) * 111;
      relevance += 200 / (1 + distance);
    }
    return relevance;
  };
  const ranked = items
    .map((item) => ({ item, score: score(item) }))
    .sort(
      (a, b) =>
        b.score - a.score || a.item.key.localeCompare(b.item.key, undefined, { numeric: true }),
    );
  // Keep headings contiguous, ordered by the best result in each section.
  const sections = new Map<string, T[]>();
  for (const { item } of ranked) {
    const section = sections.get(item.section) ?? [];
    if (section.length < (item.section === 'stations_stops' ? 12 : 8)) section.push(item);
    sections.set(item.section, section);
  }
  const exactLiveTrip = items.some(item => item.section === 'active_trips' && item.live &&
    normalize(item.serviceName ?? '').split(/\s+/).includes(q));
  const order = exactLiveTrip ? ['active_trips', 'routes', 'stations_stops', 'places_addresses'] : routeQuery
    ? ['routes', 'stations_stops', 'active_trips', 'places_addresses']
    : ['stations_stops', 'routes', 'active_trips', 'places_addresses'];
  return [...sections.entries()]
    .sort(
      ([a], [b]) =>
        (order.indexOf(a) < 0 ? 3 : order.indexOf(a)) -
        (order.indexOf(b) < 0 ? 3 : order.indexOf(b)),
    )
    .flatMap(([, section]) => section);
}
