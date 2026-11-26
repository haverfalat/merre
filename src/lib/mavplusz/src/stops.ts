import type { ClientCore } from './core';
import {
  STOP_QUERY,
  STOP_ROUTES_QUERY,
  STOP_CLUSTERS_QUERY,
  STOP_GROUPS_BY_RADIUS_QUERY,
  STOPS_BY_RADIUS_QUERY,
} from './queries';
import type { StopDetail, StopRoutesResponse, StopCluster, GroupedChildStop } from '../types/stop';
import type { StopGroupsByRadiusRequest, StopGroupRadiusResult } from '../types/geo';
import type { EpochSec } from '../types/common';

export interface StopOptions {
  /** Epoch seconds to start the departure listing from. Defaults to now. */
  startTime?: EpochSec;
  /** How many seconds of departures to include (OTP `timeRange`). */
  timeRange?: number;
}

/** Stop / station data, departure boards and stop clusters. */
export function createStopApi(core: ClientCore) {
  /**
   * Full detail of a stop: stop times for the next day, routes, alerts.
   *
   * @example
   * await futar.stop('1:005510017');
   */
  async function stop(id: string, options: StopOptions = {}): Promise<StopDetail> {
    const variables: Record<string, unknown> = {
      id,
      startTime: options.startTime ?? Math.floor(Date.now() / 1000),
      language: core.language,
    };
    if (options.timeRange !== undefined) {
      variables.timeRange = options.timeRange;
    }
    const res = await core.graphql<{ stop: StopDetail }>(STOP_QUERY, variables, 'Stop');
    return res.data!.stop;
  }

  /** Routes serving a stop, with live vehicle positions per pattern. */
  async function stopRoutes(id: string): Promise<StopRoutesResponse> {
    const res = await core.graphql<{ stop: StopRoutesResponse }>(
      STOP_ROUTES_QUERY,
      { id },
      'StopRoutes',
    );
    return res.data!.stop;
  }

  /** Lightweight stops around a coordinate, each with the routes serving it (no departures). */
  async function stopsByRadius(
    lat: number,
    lon: number,
    radius: number,
  ): Promise<GroupedChildStop[]> {
    const res = await core.graphql<{
      stopsByRadius: { edges: { node: { stop: GroupedChildStop } }[] };
    }>(STOPS_BY_RADIUS_QUERY, { lat, lon, radius, includePatterns: radius <= 400 }, 'StopsByRadius');
    return (res.data?.stopsByRadius?.edges || []).map((e) => e.node.stop);
  }

  /** Resolve one or more stop cluster ids to their grouped child stops. */
  async function stopClusters(ids: string[]): Promise<StopCluster[]> {
    const res = await core.graphql<{ stopClusters: StopCluster[] }>(
      STOP_CLUSTERS_QUERY,
      { ids },
      'StopClusters',
    );
    return res.data!.stopClusters;
  }

  /**
   * Nearby stop "groups" around a coordinate, each with upcoming departures.
   * Use `ignoredStopClusterId` or `ignoredStopGroupId` to exclude the center
   * station (pass its own id to get only the neighbouring stops).
   */
  async function stopGroupsByRadius(
    request: StopGroupsByRadiusRequest,
  ): Promise<StopGroupRadiusResult> {
    const variables: Record<string, unknown> = {
      lat: request.lat,
      lon: request.lon,
      radius: request.radius ?? 300,
      stopId: request.stopId ?? null,
      ignoredStopClusterId: request.ignoredStopClusterId ?? null,
      ignoredStopGroupId: request.ignoredStopGroupId ?? null,
      startTime: request.startTime ?? Math.floor(Date.now() / 1000),
    };
    const res = await core.graphql<{ stopGroupsByRadius: StopGroupRadiusResult }>(
      STOP_GROUPS_BY_RADIUS_QUERY,
      variables,
      'StopGroupsByRadius',
    );
    return res.data!.stopGroupsByRadius;
  }

  return { stop, stopRoutes, stopsByRadius, stopClusters, stopGroupsByRadius };
}

export type StopApi = ReturnType<typeof createStopApi>;
