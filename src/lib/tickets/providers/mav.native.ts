import {
  MavMobileClient,
  MavMobileWallet,
  parseAccountProfile,
  matchesService,
  renderTicketImages,
  epochMillis,
  MavMobileError,
} from 'mav-mobile-api';
import { onlineManager } from '@tanstack/react-query';
import { offlineMavPresentation, savedMavPresentation, offlineMavTickets, saveMavCatalog, saveMavPresentation } from '../mav-offline.native';
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
        if (!onlineManager.isOnline()) return offlineMavTickets(account.id);
        const snapshot = await wallet.snapshot({
          includeInactive: true,
          includeServices: true,
          language: language === 'hu' ? 'HU' : 'EN',
        }).catch(async error => {
          if (error instanceof MavMobileError && ['network', 'timeout'].includes(error.code)) return null;
          throw error;
        });
        if (!snapshot) return offlineMavTickets(account.id);
        const products = [...snapshot.tickets, ...snapshot.passes, ...snapshot.unclassified];
        const tickets = [];
        for (const item of products) {
          let offlineAvailable = false;
          const expiresAt = epochMillis(item.validTo);
          if (item.canInspect && item.documentId && expiresAt != null && expiresAt > Date.now() && ['VALID', 'FUTURE'].includes(item.status)) {
            try {
              if ((await savedMavPresentation(account.id, item.id))?.expiresAt !== expiresAt) {
                const images = await client.ticketImages.get([item.documentId]);
                await saveMavPresentation(account.id, item.id, { title: item.name, html: renderTicketImages(images.Bizonylatok, item.name), expiresAt, accountId: account.id });
              }
              offlineAvailable = true;
            } catch { /* An unsuccessful download must remain visible as unavailable offline. */ }
          }
          tickets.push({
          offlineAvailable,
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
          });
        }
        try { await saveMavCatalog(account.id, tickets); }
        catch { return tickets.map(ticket => ({ ...ticket, offlineAvailable: false })); }
        return tickets;
      },
      async inspector(ticketId, language) {
        const saved = await offlineMavPresentation(account.id, ticketId);
        if (saved) return saved;
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
