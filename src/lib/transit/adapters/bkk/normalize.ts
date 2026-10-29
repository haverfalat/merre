import type { OTPTransitReferences, TransitVehicle, TransitStop, TransitRoute, TransitTripStopTime } from 'bkkfutar.js/src/types';
import type { Mode } from '../../types/common';
import type { VehiclePosition } from '../../types/vehicle';
import type { TripStopTime } from '../../types/trip';
import { dateTimeEpoch } from '../../time/service-day';

export const canonicalId = (id: string) => id.replace(/^BKK_/, 'BKK:');
export const futarId = (id: string) => id.replace(/^BKK:/, 'BKK_');
export const isBkkId = (id: string) => /^BKK[:_]/.test(id);
export function routeRef(route: TransitRoute | undefined) {
  return route ? {
    id: canonicalId(route.id), mode: route.type as Mode, shortName: route.shortName ?? null,
    longName: route.longName ?? route.description ?? null, color: route.color, textColor: route.textColor,
  } : null;
}
export function stopRef(stop: TransitStop) {
  return { id: canonicalId(stop.id), gtfsId: canonicalId(stop.id), code: stop.code ?? null,
    platformCode: stop.platformCode ?? null, name: stop.name, lat: stop.lat, lon: stop.lon };
}
export function normalizeVehicle(v: TransitVehicle, refs: OTPTransitReferences): VehiclePosition {
  const trip = v.tripId ? refs.trips?.[v.tripId] : undefined;
  const route = refs.routes?.[v.routeId ?? trip?.routeId ?? ''];
  const stop = refs.stops?.[v.stopId ?? ''];
  return {
    vehicleId: canonicalId(v.vehicleId), isEstimated: false, lat: v.location.lat, lon: v.location.lon,
    heading: v.bearing ?? null, vehicleModel: v.model ?? null, label: v.label ?? null,
    licensePlate: v.licensePlate ?? null, uicCode: null, lastUpdated: v.lastUpdateTime, speed: null,
    stopRelationship: { status: ['INCOMING', 'STOPPED_AT', 'IN_TRANSIT_TO'].includes(v.status ?? '')
      ? v.status as 'INCOMING' | 'STOPPED_AT' | 'IN_TRANSIT_TO' : null,
      stop: stop ? { gtfsId: canonicalId(stop.id), name: stop.name } : null,
      arrivalTime: null, departureTime: null },
    trip: v.tripId ? { id: canonicalId(v.tripId), gtfsId: canonicalId(v.tripId),
      routeShortName: route?.shortName ?? null, tripHeadsign: trip?.tripHeadsign ?? v.label ?? null,
      tripShortName: trip?.tripShortName ?? null, serviceDate: v.serviceDate,
      route: routeRef(route), pattern: null } : null,
    nextStop: null, prevOrCurrentStop: null,
  };
}
export function normalizeStopTime(t: Omit<TransitTripStopTime, 'requiresBooking'>, refs: OTPTransitReferences, date: string): TripStopTime {
  const serviceDay = dateTimeEpoch(`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`, '00:00');
  const seconds = (value: number | undefined) => value === undefined ? null : value - serviceDay;
  const live = !t.predictionScheduled && (t.predictedArrivalTime !== undefined || t.predictedDepartureTime !== undefined);
  const arrival = live ? t.predictedArrivalTime : undefined;
  const departure = live ? t.predictedDepartureTime : undefined;
  return {
    stop: refs.stops?.[t.stopId] ? stopRef(refs.stops[t.stopId]) : {
      id: canonicalId(t.stopId), code: null, platformCode: null, name: null, lat: null, lon: null },
    requiresFirstDoorBoarding: t.requiresFirstDoorBoarding ?? null,
    headsign: t.stopHeadsign, scheduledArrival: seconds(t.arrivalTime), scheduledDeparture: seconds(t.departureTime),
    realtimeArrival: seconds(arrival ?? t.arrivalTime), realtimeDeparture: seconds(departure ?? t.departureTime),
    arrivalDelay: arrival !== undefined && t.arrivalTime !== undefined ? arrival - t.arrivalTime : null,
    departureDelay: departure !== undefined && t.departureTime !== undefined ? departure - t.departureTime : null,
    realtime: live, realtimeState: live ? 'UPDATED' : 'SCHEDULED', serviceDay,
    pickupType: t.pickupAllowed === false ? 'NONE' : 'SCHEDULED',
    dropoffType: t.dropOffAllowed === false ? 'NONE' : 'SCHEDULED', timepoint: null,
  };
}
