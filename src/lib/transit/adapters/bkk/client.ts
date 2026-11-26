import { distanceMeters } from '../../../tickets/boarding';
import { loadMetroStops } from './metro-stops';
import { readCachedMetroStops, writeCachedMetroStops } from '../../../stop-cache';
import type { RoutePattern } from '../../types/route';
import type { TripContinuation } from '../../types/trip';
import { createBkkFutar } from './futar';
import type { TransitClient, StopBoardRequest } from '../../client';
import type { VehicleBounds, VehiclePosition } from '../../types/vehicle';
import type { GroupedChildStop, StopDetail, StoptimePatternGroup } from '../../types/stop';
import { decodePolyline } from '../../../mavplusz/src/utils/polyline';
import { serviceDate } from '../../time/service-day';
import { canonicalId, futarId, normalizeVehicle, normalizeStopTime, routeRef, stopRef } from './normalize';
import { createBkkTransport } from './transport';
import { createPositionStore } from './positions';
import { generateBkkFutarApiKey, invalidateBkkFutarApiKey } from '../../../bkkfutar-api-key';
function sameTerminal(a?: import('bkkfutar.js/src/types').TransitStop, b?: import('bkkfutar.js/src/types').TransitStop) {
  return !!a && !!b && (a.id === b.id || (!!a.name && a.name === b.name &&
    distanceMeters(a.lat, a.lon, b.lat, b.lon) <= 600));
}
const positions = createPositionStore();
let metroSnapshot: { provider: string; stops: GroupedChildStop[] } | undefined;
let metroCatalog: { key: string; expires: number; promise: Promise<GroupedChildStop[]> } | undefined;

let config: { baseUrl: string; apiKey?: string } = { baseUrl: 'https://futar.bkk.hu/api/query/v1/ws' };
const transport = createBkkTransport({
  resolveApiKey: async () => config.baseUrl.startsWith('/') ? null : config.apiKey ?? generateBkkFutarApiKey(),
  invalidateApiKey: invalidateBkkFutarApiKey,
});
export function configureBkkTransport(options: typeof config) { config = options; }
export const bkkEnabled = () => !!config.baseUrl;
export function createBkkBackend() {
  const futar = createBkkFutar({ ...config, apiKey: config.apiKey ?? '', dialect: 'otp', version: '3', fetch: transport });
  const vehicles = async (request: ReturnType<typeof futar.vehicles.forLocation>, scope?: string) => {
    const { data } = await request;
    return positions.remember(data.list.filter((v) => !v.stale && v.vehicleId.startsWith('BKK_'))
      .map((v) => normalizeVehicle(v, data.references)), scope);
  };
  return {
    knownPositions: positions.read,
    knownMetroStop(id: string) {
      return metroSnapshot?.provider === JSON.stringify([config.baseUrl, config.apiKey])
        ? metroSnapshot.stops.find(stop => (stop.gtfsId || stop.id) === canonicalId(id)) : undefined;
    },
    metroStops() {
      const date = serviceDate(Date.now()).replaceAll('-', '');
      const provider = JSON.stringify([config.baseUrl, config.apiKey]);
      const key = JSON.stringify([provider, date]);
      if (!metroCatalog || metroCatalog.key !== key || metroCatalog.expires <= Date.now()) {
        const cached = readCachedMetroStops(date);
        if (cached && !metroSnapshot) {
          metroSnapshot = { provider, stops: cached };
        }
        const refresh = loadMetroStops(futar, date).then(stops => {
          metroSnapshot = { provider, stops };
          writeCachedMetroStops(date, stops);
          return stops;
        });
        const entry = {
          key,
          expires: Date.now() + 300_000,
          promise: cached ? Promise.resolve(cached) : refresh,
        };
        if (cached) void refresh.catch(() => {});
        metroCatalog = entry;
        void entry.promise.catch(() => { if (metroCatalog === entry) metroCatalog = undefined; });
      }
      return metroCatalog.promise;
    },
    async routeReferences(id: string, day?: string): Promise<RoutePattern[]> {
      const { data } = await futar.routes.getDetails(futarId(id), {
        date: (day ?? serviceDate(Date.now())).replaceAll('-', ''),
      });
      return (data.entry.variants ?? []).flatMap(variant => {
        if (!variant.patternId || !variant.stopIds.length ||
          variant.stopIds.some(stopId => !data.references.stops?.[stopId])) return [];
        return [{
          id: `bkk-reference:${variant.patternId}`, reference: true,
          headsign: variant.headsign, name: variant.name,
          directionId: variant.direction != null && /^\d+$/.test(variant.direction) ? Number(variant.direction) : null,
          stops: variant.stopIds.map(stopId => stopRef(data.references.stops![stopId])),
          coordinates: variant.polyline?.points
            ? decodePolyline(variant.polyline.points).map(({ lat, lon }) => [lon, lat] as [number, number]) : [],
        }];
      });
    },
    async tripContinuation(id: string, day?: string): Promise<TripContinuation | null> {
      const date = (day ?? serviceDate(Date.now())).replaceAll('-', '');
      const current = (await futar.trips.getDetails({ tripId: futarId(id), date })).data;
      const nextId = current.entry.nextBlockTripId;
      if (!nextId || nextId === current.entry.tripId) return null;
      const next = (await futar.trips.getDetails({ tripId: nextId, date })).data;
      const a = current.references.trips?.[current.entry.tripId];
      const b = next.references.trips?.[next.entry.tripId];
      const last = current.entry.stopTimes.at(-1);
      const first = next.entry.stopTimes[0];
      const departure = first?.departureTime;
      const arrival = last?.arrivalTime ?? last?.departureTime;
      // Block links alone do not establish a passenger connection: require a
      // matching route, service date, boarding place and chronological boundary.
      if (!a?.blockId || a.blockId !== b?.blockId || a.routeId !== b.routeId ||
        current.entry.serviceDate !== next.entry.serviceDate || !last || !first ||
        (last.stopId !== first.stopId && !sameTerminal(current.references.stops?.[last.stopId], next.references.stops?.[first.stopId])) ||
        first.pickupAllowed === false ||
        departure == null || arrival == null || departure < arrival) return null;
      const stopName = next.references.stops?.[first.stopId]?.name;
      if (!stopName || !b.tripHeadsign) return null;
      return { tripId: canonicalId(nextId), serviceDay: date,
        headsign: b.tripHeadsign, stopName, departureAt: departure };
    },
    async vehiclesInBounds(bounds: VehicleBounds): Promise<VehiclePosition[]> {
      // Clip national map views to Budapest; never request the unlimited fleet endpoint.
      const south = Math.max(bounds.swLat, 47.32), north = Math.min(bounds.neLat, 47.66);
      const west = Math.max(bounds.swLon, 18.90), east = Math.min(bounds.neLon, 19.35);
      if (south >= north || west >= east) return [];
      // Round outward to reduce requests while panning within the same area.
      const swLat = Math.floor(south * 50) / 50, neLat = Math.ceil(north * 50) / 50;
      const swLon = Math.floor(west * 50) / 50, neLon = Math.ceil(east * 50) / 50;
      const visiblePositions = () => positions.read().filter((v) =>
        v.lat! >= south && v.lat! <= north && v.lon! >= west && v.lon! <= east);
      try {
        await vehicles(futar.vehicles.forLocation({ lat: (swLat + neLat)/2, lon: (swLon + neLon)/2,
        latSpan: (neLat-swLat)/2, lonSpan: (neLon-swLon)/2 }));
      } catch (error) {
        const recent = visiblePositions();
        if (!recent.length) throw error;
        return recent;
      }
      return visiblePositions();
    },
    async vehiclePositionsForTrip(id: string, day: string) {
      return vehicles(futar.vehicles.getForTrip([futarId(id)], { date: [day.replaceAll('-', '')] }));
    },
    vehiclesForRoute: (id: string) => vehicles(futar.vehicles.forRoute([futarId(id)])),
    async vehiclesForStop(id: string) {
      const scope = `stop:${canonicalId(id)}`;
      try { await vehicles(futar.vehicles.forStop(futarId(id)), scope); } catch { /* Use recent matching vehicles. */ }
      return positions.forScope(scope);
    },
    async trip(id: string, day?: string): ReturnType<TransitClient['trip']> {
      const date = (day ?? serviceDate(Date.now())).replaceAll('-', '');
      const { data } = await futar.trips.getDetails({ tripId: futarId(id), date });
      const t = data.references.trips?.[data.entry.tripId];
      const route = t ? data.references.routes?.[t.routeId] : undefined;
      const stoptimes = data.entry.stopTimes.map((s) => normalizeStopTime(s, data.references, data.entry.serviceDate));
      const embedded = data.entry.vehicle;
      if (embedded && !embedded.stale) positions.remember([normalizeVehicle(embedded, data.references)]);
      const recent = positions.forTrip(canonicalId(data.entry.tripId), data.entry.serviceDate) ?? null;
      let position = positions.forTrip(canonicalId(data.entry.tripId), data.entry.serviceDate, 15_000) ?? null;
      if (!position) {
        try {
          position = (await vehicles(futar.vehicles.getForTrip([futarId(id)], { date: [date] })))
            .find((v) => (v.trip?.gtfsId ?? v.trip?.id) === canonicalId(id) &&
              v.trip?.serviceDate?.replaceAll('-', '') === date) ?? null;
        } catch { /* Keep the timetable usable when no live lookup is available. */ }
        position ??= recent;
      }
      if (position) {
        const now = Date.now() / 1000;
        const nextIndex = stoptimes.findIndex((s) => (s.serviceDay ?? 0) + (s.realtimeArrival ?? s.realtimeDeparture ?? 0) >= now);
        const current = nextIndex > 0 ? stoptimes[nextIndex - 1] : undefined;
        const next = nextIndex >= 0 ? stoptimes[nextIndex] : undefined;
        if (current) position.prevOrCurrentStop = {
          scheduledArrival: current.scheduledArrival, realtimeArrival: current.realtimeArrival,
          arrivalDelay: current.arrivalDelay, scheduledDeparture: current.scheduledDeparture,
          realtimeDeparture: current.realtimeDeparture, departureDelay: current.departureDelay,
        };
        if (next) position.nextStop = { arrivalDelay: next.arrivalDelay, stop: { name: next.stop.name } };
      }
      return { id: canonicalId(data.entry.tripId), tripHeadsign: t?.tripHeadsign, tripShortName: t?.tripShortName,
        directionId: t?.directionId === undefined ? null : Number(t.directionId),
        route: route ? { ...routeRef(route)!, agency: { name: 'BKK', id: 'BKK:BKK' } } : null,
        stoptimes,
        vehiclePositions: position ? [position] : [],
        decodedPolyline: data.entry.polyline?.points
          ? decodePolyline(data.entry.polyline.points).map(({lat,lon}) => [lat,lon]) : [],
      };
    },
    async stop(id: string, options?: StopBoardRequest): Promise<StopDetail | null> {
      const fullDay = options?.startTime != null && (options.timeRange ?? 0) > 180 * 60;
      const { data } = fullDay ? await (async () => {
        const result = await futar.schedule.forStop({ stopId: [futarId(id)],
          date: serviceDate(options.startTime! * 1000).replaceAll('-', ''), onlyDepartures: false });
        const entry = result.data.entry;
        return { data: { references: result.data.references, entry: {
          stopId: entry.stopId,
          stopTimes: entry.schedules.flatMap((schedule) => schedule.directions.flatMap((direction) =>
            direction.stopTimes.map((time) => ({ ...time,
              serviceDate: time.serviceDate || entry.serviceDate || entry.date,
              stopId: time.stopId || entry.stopId,
            })))),
        } } };
      })() : await futar.arrivals.forStop({ stopId: [futarId(id)],
        onlyDepartures: false,
        time: options?.startTime, minutesBefore: 2, minutesAfter: Math.min(180, Math.ceil((options?.timeRange ?? 3600)/60)),
        includeVehicleFromTrip: true,
        includeVehicleFromVehicleBlock: true });
      const stop = data.references.stops?.[futarId(id)];
      if (!stop) return null;
      const metro = metroSnapshot?.provider === JSON.stringify([config.baseUrl, config.apiKey])
        ? metroSnapshot.stops.find(item => (item.gtfsId || item.id) === canonicalId(id)) : undefined;
      const groups = new Map<string, StoptimePatternGroup>();
      for (const t of data.entry.stopTimes) {
        if (canonicalId(t.stopId ?? data.entry.stopId) !== canonicalId(id)) continue;
        const trip = data.references.trips?.[t.tripId];
        if (!trip || (metro && !metro.routes?.some(route => route.id === canonicalId(trip.routeId)))) continue;
        const headsign = t.stopHeadsign || trip.tripHeadsign;
        const origins = new Set((metro?.boardingDirections ?? []).filter(direction =>
          direction.routeId === canonicalId(trip.routeId) && direction.headsign === headsign &&
          (trip.directionId == null || direction.directionId == null || direction.directionId === trip.directionId))
          .map(direction => direction.origin).filter((name): name is string => !!name));
        const route = data.references.routes?.[trip.routeId];
        const routeParts = (route?.longName ?? '').split(/\s+-\s+|\s+↔\s+|\s+–\s+/).map(s => s.trim()).filter(Boolean);
        const inferredOrigin = routeParts.length >= 2
          ? routeParts.find(part => part.toLocaleLowerCase() !== headsign.toLocaleLowerCase())
          : undefined;
        const origin = origins.size === 1 ? [...origins][0] : inferredOrigin;
        const key = `${trip.routeId}|${headsign}|${origin ?? ''}`;
        if (!groups.has(key)) groups.set(key, { pattern: { headsign, fromStopName: origin,
          route: routeRef(route) }, times: [] });
        const vehicle = t.vehicle && !t.vehicle.stale ? (() => {
          const vehicleTrip = t.vehicle.tripId ? data.references.trips?.[t.vehicle.tripId] : undefined;
          const incoming = !!t.vehicle.tripId && t.vehicle.tripId !== t.tripId;
          return {
            vehicleId: canonicalId(t.vehicle.vehicleId),
            tripId: t.vehicle.tripId ? canonicalId(t.vehicle.tripId) : null,
            incoming,
            incomingHeadsign: incoming ? (vehicleTrip?.tripHeadsign ?? t.vehicle.label ?? null) : null,
            licensePlate: t.vehicle.licensePlate ?? null,
            vehicleModel: t.vehicle.model ?? null,
          };
        })() : null;
        groups.get(key)!.times.push({ ...normalizeStopTime({ ...t, stopHeadsign: headsign, stopId: t.stopId ?? data.entry.stopId }, data.references, t.serviceDate),
          realtimeState: ('canceled' in t && t.canceled === true) ? 'CANCELED' : (!t.predictionScheduled && (t.predictedArrivalTime !== undefined || t.predictedDepartureTime !== undefined) ? 'UPDATED' : 'SCHEDULED'),
          trip: { id: canonicalId(t.tripId), gtfsId: canonicalId(t.tripId), tripHeadsign: headsign },
          vehicle });
      }
      for (const t of data.entry.stopTimes) {
        if (t.vehicle && !t.vehicle.stale) positions.remember([normalizeVehicle({ ...t.vehicle,
          tripId: t.vehicle.tripId ?? t.tripId, serviceDate: t.vehicle.serviceDate ?? t.serviceDate }, data.references)], `stop:${canonicalId(id)}`);
      }
      if (!fullDay && !metro) {
        const routes = [...new Set(data.entry.stopTimes.filter(time =>
          time.departureTime != null && time.arrivalTime == null
        ).map(time => data.references.trips?.[time.tripId]?.routeId).filter((route): route is string => !!route))];
        // A terminal can use different boarding and alighting platforms. Read the
        // opposite platform's board even when no vehicle has its next assignment yet.
        await Promise.allSettled(routes.map(async routeId => {
          const details = (await futar.routes.getDetails(routeId)).data;
          if (!details.entry.variants.some(v => v.stopIds[0] === stop.id)) return;
          const terminals = new Map<string, Set<string>>();
          for (const variant of details.entry.variants) {
            const end = details.references.stops?.[variant.stopIds.at(-1) ?? ''];
            const origin = details.references.stops?.[variant.stopIds[0]]?.name;
            if (!end || !origin || end.id === stop.id || !sameTerminal(stop, end)) continue;
            const origins = terminals.get(end.id) ?? new Set<string>();
            origins.add(origin);
            terminals.set(end.id, origins);
          }
          await Promise.all([...terminals].map(async ([stopId, origins]) => {
            const board = (await futar.arrivals.forStop({ stopId: [stopId], includeRouteId: [routeId],
              onlyDepartures: false, includeVehicleFromTrip: true, time: options?.startTime,
              minutesBefore: 2, minutesAfter: Math.min(180, Math.ceil((options?.timeRange ?? 3600) / 60)) })).data;
            for (const time of board.entry.stopTimes) {
              const trip = board.references.trips?.[time.tripId];
              if (trip?.routeId !== routeId || (time.stopId ?? board.entry.stopId) !== stopId ||
                time.arrivalTime == null || time.departureTime != null || time.dropOffAllowed === false) continue;
              const key = routeId + '|' + stopId + '|arrival';
              if (!groups.has(key)) groups.set(key, { pattern: { headsign: trip.tripHeadsign,
                fromStopName: origins.size === 1 ? [...origins][0] : undefined,
                route: routeRef(board.references.routes?.[routeId]) }, times: [] });
              const vehicle = time.vehicle;
              groups.get(key)!.times.push({
                ...normalizeStopTime({ ...time, stopId, pickupAllowed: false }, board.references, time.serviceDate),
                ...('canceled' in time && time.canceled ? { realtimeState: 'CANCELED' as const } : {}),
                trip: { id: canonicalId(time.tripId), gtfsId: canonicalId(time.tripId), tripHeadsign: trip.tripHeadsign },
                vehicle: vehicle && !vehicle.stale && (!vehicle.tripId || vehicle.tripId === time.tripId)
                  ? { vehicleId: canonicalId(vehicle.vehicleId), tripId: canonicalId(time.tripId) } : null,
              });
            }
          }));
        }));
      }
      return { ...stopRef(stop), stopTimes: [...groups.values()] };
    },
  };
}
