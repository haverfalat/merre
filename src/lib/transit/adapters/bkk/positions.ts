import type { VehiclePosition } from '../../types/vehicle';

/** Short continuity window shared by map, board, route and trip requests. */
export function createPositionStore() {
  const scopes = new Map<string, { keys: Set<string>; received: number }>();
  const positions = new Map<string, { position: VehiclePosition; received: number }>();
  const key = (v: VehiclePosition) => `${v.trip?.gtfsId ?? v.trip?.id}|${(v.trip?.serviceDate ?? '').replaceAll('-', '')}`;
  function read() {
    for (const [id, entry] of positions)
      if (Date.now() - entry.received > 60_000) positions.delete(id);
    for (const [id, entry] of scopes) if (Date.now() - entry.received > 60_000) scopes.delete(id);
    return [...positions.values()].map((entry) => entry.position);
  }
  return {
    read,
    forScope(scope: string) {
      return read().filter((v) => scopes.get(scope)?.keys.has(key(v)));
    },
    remember(incoming: VehiclePosition[], scope?: string) {
      read();
      for (const position of incoming) {
        if (!position.trip || position.lat === null || position.lon === null) continue;
        for (const [id, entry] of positions) {
          if (id !== key(position) && position.vehicleId && entry.position.vehicleId === position.vehicleId &&
            (position.lastUpdated ?? 0) >= (entry.position.lastUpdated ?? 0)) positions.delete(id);
        }
        const previous = positions.get(key(position));
        // Re-reading a cached response must not extend the lifetime of an old position.
        if (!previous || (position.lastUpdated ?? 0) > (previous.position.lastUpdated ?? 0) ||
          (position.lastUpdated === previous.position.lastUpdated &&
            (position.lat !== previous.position.lat || position.lon !== previous.position.lon)))
          positions.set(key(position), { position, received: Date.now() });
      }
      if (scope && incoming.length) {
        const previous = scopes.get(scope);
        scopes.set(scope, { keys: new Set([...(previous?.keys ?? []), ...incoming.map(key)]), received: Date.now() });
      }
      return incoming;
    },
    forTrip(id: string, day: string, maxAge = 60_000) {
      return read().find((v) => (v.trip?.gtfsId ?? v.trip?.id) === id &&
        (v.trip?.serviceDate ?? '').replaceAll('-', '') === day.replaceAll('-', '') &&
        Date.now() - (positions.get(key(v))?.received ?? 0) <= maxAge);
    },
  };
}
