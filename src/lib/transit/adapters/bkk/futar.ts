import { createArrivalsModule } from 'bkkfutar.js/src/arrivals';
import { createScheduleModule } from 'bkkfutar.js/src/schedule';
import { createTripsModule } from 'bkkfutar.js/src/trips';
import { createVehiclesModule } from 'bkkfutar.js/src/vehicles';
import type { FutarClient, FutarClientConfig } from 'bkkfutar.js/src/client';

/** Use upstream endpoint modules with Merre's cached, rate-limited transport. */
export function createBkkFutar(config: FutarClientConfig & { fetch: typeof fetch }) {
  const client: FutarClient = {
    async request(path, params = {}, options = {}, method = 'GET', body) {
      const query = new URLSearchParams({ key: config.apiKey });
      const version = options.version ?? config.version;
      const appVersion = options.appVersion ?? config.appVersion;
      if (version) query.set('version', String(version));
      if (appVersion) query.set('appVersion', appVersion);
      if (options.includeReferences?.length) query.set('includeReferences', options.includeReferences.join(','));
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) for (const item of value) query.append(key, String(item));
        else query.set(key, String(value));
      }
      const hasBody = method === 'POST' && body !== undefined;
      const response = await config.fetch(
        `${config.baseUrl ?? 'https://futar.bkk.hu/api/query/v1/ws'}/${options.dialect ?? config.dialect ?? 'otp'}${path}?${query}`,
        { method, headers: { ...options.headers, ...(hasBody ? { 'Content-Type': 'application/json' } : {}) },
          ...(hasBody ? { body: JSON.stringify(body) } : {}) },
      );
      if (!response.ok) throw new Error('BKK service unavailable');
      return response.json();
    },
  };
  return {
    arrivals: createArrivalsModule(client),
    schedule: createScheduleModule(client),
    trips: createTripsModule(client),
    vehicles: createVehiclesModule(client),
  };
}
