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
    let lastProducts: Awaited<ReturnType<typeof wallet.snapshot>> | null = null;
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
        lastProducts = snapshot;
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
        const snapshot = lastProducts ?? await wallet.snapshot({ includeInactive: true,
          language: language === 'hu' ? 'HU' : 'EN' });
        const product = [...snapshot.tickets, ...snapshot.passes, ...snapshot.unclassified].find(item => item.id === ticketId);
        if (!product?.documentId || !product.canInspect) throw new MavMobileError('unavailable', 'Ticket image unavailable');
        const response = await client.ticketImages.get([product.documentId]);
        const archive = product.status !== 'VALID';
        const validTo = epochMillis(product.validTo);
        const expiresAt = archive ? Date.now() + 600_000 : Math.min(validTo ?? Date.now() + 600_000, Date.now() + 600_000);
        let html = renderTicketImages(response.Bizonylatok, product.name);
        if (archive) html = html.replace('<main>', `<main><p style="padding:12px;color:#a32020;font-weight:bold;text-align:center">${language === 'hu' ? 'Csak előnézet – nem érvényes utazásra' : 'Preview only – not valid for travel'}</p>`);
        return { title: product.name, html, expiresAt, accountId: account.id };
      },
    };
  },
};
