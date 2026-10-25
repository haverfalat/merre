import type { ClientCore } from './core';
import {
  PLAN_PARAMETERS_QUERY,
  GET_COUNTRIES_QUERY,
  GET_AGENCIES_QUERY,
  ROUTES_QUERY,
} from './queries';
import type { PlanParameters, Country, Agency } from '../types/geo';
import type { RouteSummary } from '../types/route';

/** Networking meta: supported countries, agencies, routes and plan options. */
export function createMetaApi(core: ClientCore) {
  /** Fares, comfort levels and search parameter catalogue for the plan UI. */
  async function planParameters(): Promise<PlanParameters> {
    const res = await core.graphql<{ planParameters: PlanParameters }>(
      PLAN_PARAMETERS_QUERY,
      {
        language: core.config.language,
        distributionChannel: core.config.distributionChannel,
        distributionSubChannel: core.config.distributionSubChannel,
      },
      'PlanParameters',
    );
    return res.data!.planParameters;
  }

  /** List the countries served by the network (ISO codes + localized names). */
  async function countries(): Promise<Country[]> {
    const res = await core.graphql<{ countries: Country[] }>(
      GET_COUNTRIES_QUERY,
      {},
      'getCountries',
    );
    return res.data!.countries;
  }

  /** List transit agencies, optionally filtered by country ISO codes. */
  async function agencies(countryIsoCodes: string[] = ['hu']): Promise<Agency[]> {
    const res = await core.graphql<{ agencies: Agency[] }>(
      GET_AGENCIES_QUERY,
      {
        countryIsoCodes,
      },
      'getAgencies',
    );
    return res.data!.agencies;
  }

  /** Compact list of all routes, optionally filtered by country ISO codes. */
  async function routes(countryIsoCodes: string[] = ['hu']): Promise<RouteSummary[]> {
    const res = await core.graphql<{ routes: RouteSummary[] }>(
      ROUTES_QUERY,
      {
        countryIsoCodes,
      },
      'Routes',
    );
    return res.data!.routes;
  }

  return { planParameters, countries, agencies, routes };
}

export type MetaApi = ReturnType<typeof createMetaApi>;
