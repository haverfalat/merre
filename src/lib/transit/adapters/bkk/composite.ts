import type { TransitClient, TransitRequest } from '../../client';
import type { StopDetail, Stoptime } from '../../types/stop';
import type { VehiclePosition } from '../../types/vehicle';
import { bkkEnabled, createBkkBackend } from './client';
import { isBkkId } from './normalize';

const liveTime = (time: { realtime?: boolean | null; realtimeState?: string | null }) =>
  !!time.realtime || ['UPDATED', 'CANCELED', 'SKIPPED'].includes(time.realtimeState ?? '');
const positioned = (v: { lat: number | null; lon: number | null }) =>
  v.lat != null && v.lon != null && Number.isFinite(v.lat) && Number.isFinite(v.lon);

/** MÁV owns overlapping records; direct predictions only fill missing realtime. */
export function mergeBkkBoard(national: StopDetail | null, local: StopDetail): StopDetail {
  if (!national) return local;
  const key = (t: Stoptime) => `${t.trip?.gtfsId ?? t.trip?.id}|${t.serviceDay}|${t.stop?.id ?? national.id}`;
  const direct = new Map((local.stopTimes ?? []).flatMap((g) => g.times.map((t) => [key(t), t] as const)));
  const seen = new Set<string>();
  const groups = (national.stopTimes ?? []).map((g) => ({ ...g, times: g.times.map((t) => {
    seen.add(key(t));
    const backup = direct.get(key(t));
    return !liveTime(t) && backup && liveTime(backup) ? { ...backup, ...t,
      realtime: backup.realtime, realtimeState: backup.realtimeState,
      realtimeArrival: backup.realtimeArrival, realtimeDeparture: backup.realtimeDeparture,
      arrivalDelay: backup.arrivalDelay, departureDelay: backup.departureDelay,
    } : t;
  }) }));
  return { ...local, ...national, stopTimes: [...groups,
    ...(local.stopTimes ?? []).map((g) => ({ ...g, times: g.times.filter((t) => !seen.has(key(t))) })).filter((g) => g.times.length),
  ] };
}

/** MÁVPlusz first; query BKK only when a BKK view has no usable primary live data. */
export function withBkk(mav: TransitClient, { signal }: TransitRequest): TransitClient {
  if (!bkkEnabled()) return mav;
  const bkk = createBkkBackend();
  async function attempt<T>(request: () => Promise<T>) {
    signal.throwIfAborted();
    try { const value = await request(); signal.throwIfAborted(); return { value }; }
    catch (error) { signal.throwIfAborted(); return { error }; }
  }
  return {
    ...mav, backendId: 'mavplusz+bkk',
    vehiclesInBounds: async (bounds, modes) => {
      const national = await attempt(() => mav.vehiclesInBounds(bounds, modes));
      const valid = (v: VehiclePosition) => positioned(v) && !!v.trip?.route?.mode && modes.includes(v.trip.route.mode) &&
        v.lat! >= bounds.swLat && v.lat! <= bounds.neLat && v.lon! >= bounds.swLon && v.lon! <= bounds.neLon;
      const primary = (national.value ?? []).filter(valid);
      const supportsBkk = modes.some((mode) => ['BUS', 'TRAM', 'TROLLEYBUS', 'SUBWAY', 'SUBURBAN_RAILWAY', 'FERRY'].includes(mode));
      if (!supportsBkk) { if (national.error) throw national.error; return primary; }
      if (primary.some((v) => isBkkId(v.trip?.gtfsId ?? v.trip?.id ?? ''))) return primary;
      const local = await attempt(() => bkk.vehiclesInBounds(bounds));
      if (national.error && local.error) throw national.error;
      const positions = new Map<string, VehiclePosition>();
      for (const v of [...(local.value ?? []).filter(valid), ...primary]) {
        const id = v.trip?.gtfsId ?? v.trip?.id;
        const key = id ? `${id}|${(v.trip?.serviceDate ?? '').replaceAll('-', '')}` : v.vehicleId;
        if (key) positions.set(key, v);
      }
      return [...positions.values()];
    },
    trip: async (id, day) => {
      if (!isBkkId(id)) return mav.trip(id, day);
      const national = await attempt(() => mav.trip(id, day));
      const primary = national.value;
      if (primary?.vehiclePositions?.some(positioned)) return primary;
      const local = await attempt(() => bkk.trip(id, day));
      if (!local.value) { if (national.error) throw national.error; return primary ?? null; }
      if (!primary) return local.value;
      return { ...local.value, ...primary,
        vehiclePositions: local.value.vehiclePositions,
        stoptimes: primary.stoptimes?.some(liveTime) ? primary.stoptimes : local.value.stoptimes ?? primary.stoptimes,
        decodedPolyline: primary.decodedPolyline.length ? primary.decodedPolyline : local.value.decodedPolyline,
      };
    },
    stop: async (id, options) => {
      if (!isBkkId(id) || options?.timetable) return mav.stop(id, options);
      const national = await attempt(() => mav.stop(id, options));
      if (national.value?.stopTimes?.some((g) => g.times.some(liveTime))) return national.value;
      const local = await attempt(() => bkk.stop(id, options));
      if (local.value) return mergeBkkBoard(national.value ?? null, local.value);
      if (national.error) throw national.error;
      return national.value ?? null;
    },
    route: async (id, options) => {
      const route = await mav.route(id, options);
      signal.throwIfAborted();
      if (!route || !isBkkId(id) || route.patterns?.some((p) => p.vehiclePositions?.some(positioned))) return route;
      const local = await attempt(() => bkk.vehiclesForRoute(id));
      if (!local.value?.length) return route;
      const patterns = (route.patterns ?? []).map((p) => ({ ...p, vehiclePositions: [...(p.vehiclePositions ?? [])] }));
      for (const v of local.value.filter(positioned)) {
        const pattern = patterns.find((p) => p.headsign === v.trip?.tripHeadsign) ?? patterns[0];
        if (pattern) pattern.vehiclePositions.push(v);
      }
      return { ...route, patterns };
    },
    stopRoutes: async (id) => {
      const stop = await mav.stopRoutes(id);
      signal.throwIfAborted();
      if (!stop || !isBkkId(id) || stop.routes.some((r) => r.patterns?.some((p) => p.vehiclePositions?.some(positioned)))) return stop;
      const local = await attempt(() => bkk.vehiclesForStop(id));
      if (!local.value?.length) return stop;
      return { ...stop, routes: stop.routes.map((route) => ({ ...route,
        patterns: [...(route.patterns ?? []), { id: null, stops: stop.boardingStops ?? [stop],
          vehiclePositions: local.value!.filter((v) => positioned(v) && v.trip?.route?.id === route.id) }],
      })) };
    },
  };
}
