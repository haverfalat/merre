import {
  BudapestGoClient,
  asObject,
  requireString,
  type BoardingTarget,
  type Ticket,
  type MetroStation,
} from 'budapestgo-api/mobile';
import { distanceMeters } from '../tickets/boarding';
import type { BoardingChoice, TicketBackend, TicketProvider } from '../tickets/types';
import { cryptoAdapter } from './auth/crypto';
import { parseBudapestGoProfile, type BudapestGoProfile } from './profile';
import { boardingScreen, inspectorScreen } from './presentation.native';

let metroCatalog: Promise<MetroStation[]> | null = null;

export const budapestGoProvider: TicketProvider = {
  id: 'budapestgo',
  name: 'BudapestGO',
  supportsService: (service) =>
    /^BKK[:_]/i.test(service.routeId ?? '') ||
    /bkk|budapesti k[oö]zleked[eé]si k[oö]zpont/i.test(
      `${service.agencyId ?? ''} ${service.agencyName ?? ''}`,
    ),
  loginRoute: '/budapestgo/login',
  reauthenticateRoute: (account) => ({ pathname: '/budapestgo/login', params: { account } }),
  capabilities: ['inspector', 'boarding', 'nearby', 'stations', 'scan', 'import', 'export'],
  identity(payload) {
    const profile = parseBudapestGoProfile(payload);
    return `${profile.installation.applicationId}:${profile.owner?.sub ?? ''}`;
  },
  async importAccount(payload) {
    let profile = parseBudapestGoProfile(payload);
    const client = new BudapestGoClient(
      profile.installation.applicationId,
      profile.session,
      async (session) => {
        profile = { ...profile, session };
      },
      cryptoAdapter,
    );
    const account = await client.userinfo();
    return {
      label: account.email ?? account.name ?? 'BudapestGO',
      payload: { ...profile, owner: account },
      identity: profile.installation.applicationId,
    };
  },
  connect(account, persist): TicketBackend {
    let profile: BudapestGoProfile = parseBudapestGoProfile(account.payload);
    const client = new BudapestGoClient(
      profile.installation.applicationId,
      profile.session,
      async (session) => {
        const next = { ...profile, session };
        await persist(next);
        profile = next;
      },
      cryptoAdapter,
    );
    const dictionaries = new Map<string, Record<string, string>>();
    const labels = async (language: 'hu' | 'en') => {
      const cached = dictionaries.get(language);
      if (cached) return cached;
      const result = await client.labels(language === 'hu' ? 'HU' : 'EN');
      dictionaries.set(language, result);
      return result;
    };
    const name = (ticket: Ticket, dictionary: Record<string, string>) =>
      dictionary[ticket.productNameId ?? ''] ?? ticket.productNameId ?? 'BudapestGO';
    const presentBoarding = async (ticketId: string, target: unknown, language: 'hu' | 'en') => {
      const input = asObject(target);
      const typed: BoardingTarget =
        input.kind === 'code'
          ? { kind: 'code', value: requireString(input.value), title: 'QR / Aztec' }
          : input.kind === 'metro'
            ? {
                kind: 'metro',
                stationId: requireString(input.stationId),
                title: requireString(input.title),
              }
            : {
                kind: 'vehicle',
                licensePlate: requireString(input.licensePlate),
                title: requireString(input.title),
              };
      const [result, dictionary] = await Promise.all([
        client.validate(ticketId, typed),
        labels(language),
      ]);
      return boardingScreen(
        account.id,
        ticketId,
        result.response,
        result.receivedAt,
        result.code,
        dictionary,
        language,
      );
    };
    return {
      async tickets(language) {
        const [tickets, dictionary] = await Promise.all([client.tickets(), labels(language)]);
        return tickets
          .filter((t) => !!t.purchaseId)
          .map((ticket) => ({
            id: ticket.purchaseId!,
            name: name(ticket, dictionary),
            status: ticket.ticketValidity ?? 'INVALID',
            validFrom: ticket.validityStart ?? null,
            validTo: ticket.validityEnd ?? null,
            bound: ticket.validToken === true,
            canInspect:
              ticket.ticketValidity === 'VALID' &&
              ticket.validToken === true &&
              ticket.newTokenAvailable === true,
            canBoard:
              ticket.ticketValidity === 'VALID' &&
              ticket.validToken === true &&
              ticket.validationByUserAvailable === true,
          }))
          .sort((a, b) => Number(b.canBoard || b.canInspect) - Number(a.canBoard || a.canInspect));
      },
      async inspector(ticketId, language) {
        const [result, dictionary] = await Promise.all([
          client.inspector(ticketId),
          labels(language),
        ]);
        return inspectorScreen(
          account.id,
          result.tokenId,
          result.ticket,
          name(result.ticket, dictionary),
          result.receivedAt,
          language,
        );
      },
      boarding: presentBoarding,
      scan: (ticketId, code, language) =>
        presentBoarding(ticketId, { kind: 'code', value: code.value }, language),
      async nearby(latitude, longitude) {
        metroCatalog ??= client.metroStations().catch((error) => {
          metroCatalog = null;
          throw error;
        });
        const [vehicles, stations] = await Promise.all([
          client.nearby(latitude, longitude),
          metroCatalog,
        ]);
        const choices: BoardingChoice[] = vehicles
          .filter(
            (vehicle) =>
              vehicle.latitude !== undefined &&
              vehicle.longitude !== undefined &&
              distanceMeters(latitude, longitude, vehicle.latitude, vehicle.longitude) <= 1000,
          )
          .map((vehicle) => ({
            id: `vehicle:${vehicle.id}`,
            kind: 'vehicle',
            queriedAt: Date.now(),
            title: `${vehicle.routeName} → ${vehicle.headsign}`,
            subtitle: vehicle.licensePlate,
            routeName: vehicle.routeName,
            headsign: vehicle.headsign,
            mode: vehicle.mode,
            color: vehicle.color,
            routeId: vehicle.routeId,
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            target: {
              kind: 'vehicle',
              licensePlate: vehicle.licensePlate,
              title: `${vehicle.routeName} · ${vehicle.licensePlate}`,
            },
          }));
        for (const station of stations) {
          if (distanceMeters(latitude, longitude, station.latitude, station.longitude) > 500)
            continue;
          choices.push({
            id: `metro:${station.id}`,
            kind: 'metro',
            title: `${station.lines.join(' / ')} → ${station.name}`,
            subtitle: station.name,
            routeName: station.lines.join(' / '),
            headsign: station.name,
            mode: 'SUBWAY',
            latitude: station.latitude,
            longitude: station.longitude,
            target: { kind: 'metro', stationId: station.id, title: station.name },
          });
        }
        return choices;
      },
      async stations(language) {
        const [stations, dictionary] = await Promise.all([
          client.metroStations(),
          labels(language),
        ]);
        return stations.map((station) => ({
          id: `metro:${station.id}`,
          title: dictionary[station.name] ?? station.name,
          subtitle: station.lines.join(' · '),
          latitude: station.latitude,
          longitude: station.longitude,
          target: {
            kind: 'metro',
            stationId: station.id,
            title: dictionary[station.name] ?? station.name,
          },
        }));
      },
    };
  },
};
