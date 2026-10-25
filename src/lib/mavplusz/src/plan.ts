import type { ClientCore } from './core';
import { PLAN_QUERY } from './queries';
import { toOtpPlace } from './utils/place';
import type { PlanRequest, PlanResult, TransportMode } from '../types/plan';
import type { Mode } from '../types/common';

const DEFAULT_PLAN_MODES: Mode[] = [
  'RAIL',
  'RAIL_REPLACEMENT_BUS',
  'SUBURBAN_RAILWAY',
  'TRAMTRAIN',
  'SUBWAY',
  'TRAM',
  'TROLLEYBUS',
  'BUS',
  'FERRY',
  'COACH',
];

/** Journey planning. */
export function createPlanApi(core: ClientCore) {
  /**
   * Plan an itinerary between two places.
   *
   * @example
   * await futar.plan({
   *   from: { name: 'Budapest-Keleti', gtfsId: '1:005510017_0' },
   *   to: { name: 'Vác', gtfsId: '1:005510447_0' },
   *   date: '2026-08-10',
   *   time: '12:58',
   * });
   */
  async function plan(request: PlanRequest): Promise<PlanResult> {
    const fromPlace = toOtpPlace(request.from);
    const toPlace = toOtpPlace(request.to);
    const modes = request.modes ?? DEFAULT_PLAN_MODES;

    const transportModes: TransportMode[] = modes.map((mode) => ({ mode }));

    const variables: Record<string, unknown> = {
      arriveBy: request.arriveBy ?? false,
      banned: request.banned ?? {},
      bikeReluctance: request.bikeReluctance,
      carReluctance: request.carReluctance,
      date: request.date,
      fromPlace,
      modes: transportModes,
      numItineraries: request.numItineraries ?? 15,
      preferred: request.preferred ?? {},
      time: request.time,
      toPlace,
      unpreferred: request.unpreferred ?? {},
      walkReluctance: request.walkReluctance,
      walkSpeed: request.walkSpeed,
      wheelchair: request.wheelchair,
      minTransferTime: request.minTransferTime,
      transitPassFilter: request.transitPassFilter ?? [],
      comfortLevels: request.comfortLevels ?? [],
      searchParameters: request.searchParameters ?? [],
      distributionChannel: core.config.distributionChannel,
      distributionSubChannel: core.config.distributionSubChannel,
      passengers: request.passengers,
      pageCursor: request.pageCursor ?? '',
      locale: core.language,
    };

    const res = await core.graphql<{ plan: PlanResult }>(PLAN_QUERY, variables, 'Plan');
    return res.data!.plan;
  }

  return { plan };
}

export type PlanApi = ReturnType<typeof createPlanApi>;
