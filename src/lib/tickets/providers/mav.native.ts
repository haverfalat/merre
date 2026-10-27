import {
  MavMobileClient,
  MavMobileWallet,
  parseAccountProfile,
  matchesService,
} from 'mav-mobile-api';
import { cleanTransitLabel } from '~/lib/transit/labels';
import type { TicketProvider } from '../types';

export const mavProvider: TicketProvider = {
  id: 'mav',
  name: 'MÁV',
  loginRoute: '/mav/login',
  reauthenticateRoute: (account) => ({ pathname: '/mav/login', params: { account } }),
  capabilities: ['inspector', 'import', 'export'],
  matchesService(ticket, service) {
    if (ticket.status !== 'VALID') return false;
    const number = cleanTransitLabel(service.tripName).split(/\s+/)[0];
    return matchesService(
      {
        kind: ticket.kind ?? 'unknown',
        status: 'VALID',
        validFrom: ticket.validFrom,
        validTo: ticket.validTo,
        services: ticket.services ?? [],
      },
      {
        routeName: service.routeName ?? '',
        ...(number ? { number } : {}),
        ...(service.serviceDay ? { serviceDay: service.serviceDay } : {}),
        ...(service.at != null ? { at: service.at } : {}),
      },
    );
  },
  identity(payload) {
    return parseAccountProfile(payload).email.toLowerCase();
  },
  async importAccount(payload) {
    const webSession =
      payload &&
      typeof payload === 'object' &&
      (payload as { provider?: unknown }).provider === 'mav-web';
    const profile = webSession
      ? await new MavMobileClient().auth.importWebSession(payload)
      : parseAccountProfile(payload);
    return { label: profile.email, payload: profile, identity: profile.email.toLowerCase() };
  },
  connect(account, persist) {
    const client = new MavMobileClient({
      profile: account.payload,
      persist: (profile) => (profile ? persist(profile) : Promise.resolve()),
    });
    const wallet = new MavMobileWallet(client);
    return {
      async tickets(language) {
        const snapshot = await wallet.snapshot({
          includeInactive: true,
          includeServices: true,
          language: language === 'hu' ? 'HU' : 'EN',
        });
        return [...snapshot.tickets, ...snapshot.passes, ...snapshot.unclassified].map((item) => ({
          id: item.id,
          kind: item.kind,
          services: item.services,
          name: item.name,
          status: item.status === 'FUTURE' ? 'FUTURE_VALID' : item.status,
          validFrom: item.validFrom,
          validTo: item.validTo,
          canInspect: item.canInspect,
          canBoard: false,
          bound: true,
        }));
      },
      async inspector(ticketId, language) {
        const result = await wallet.inspector(ticketId, {
          language: language === 'hu' ? 'HU' : 'EN',
        });
        return {
          title: result.title,
          html: result.html,
          expiresAt: result.expiresAt,
          accountId: account.id,
        };
      },
    };
  },
};
