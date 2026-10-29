import {
  MavMobileClient,
  MavMobileWallet,
  parseAccountProfile,
  matchesService,
  renderTicketImages,
  epochMillis,
  MavMobileError,
  type WalletProduct,
  type WalletSnapshot,
} from 'mav-mobile-api';
import { onlineManager } from '@tanstack/react-query';
import { offlineMavPresentation, savedMavPresentation, offlineMavTickets, saveMavCatalog, saveMavPresentation } from '../mav-offline.native';
import { cleanTransitLabel } from '~/lib/transit/labels';
import type { TicketProvider, WalletTicket } from '../types';

function walletTickets(snapshot: WalletSnapshot): WalletTicket[] {
  return [...snapshot.tickets, ...snapshot.passes, ...snapshot.unclassified].map(item => ({
    id: item.id, kind: item.kind, services: item.services, name: item.name,
    status: item.status === 'FUTURE' ? 'FUTURE_VALID' : item.status,
    validFrom: item.validFrom, validTo: item.validTo, canInspect: item.canInspect,
    canBoard: false, bound: true, offlineAvailable: false,
  }));
}

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
    return { label: profile.email, payload: profile };
  },
  connect(account, persist) {
    const client = new MavMobileClient({
      profile: account.payload,
      persist: (profile) => (profile ? persist(profile) : Promise.resolve()),
    });
    const wallet = new MavMobileWallet(client);
    let lastProducts: Awaited<ReturnType<typeof wallet.snapshot>> | null = null;
    let generation = 0;
    const downloads = new Map<string, Promise<string>>();
    function download(product: WalletProduct) {
      const documentId = product.documentId!;
      let pending = downloads.get(documentId);
      if (!pending) {
        pending = client.ticketImages.get([documentId])
          .then(response => renderTicketImages(response.Bizonylatok, product.name))
          .finally(() => { downloads.delete(documentId); });
        downloads.set(documentId, pending);
      }
      return pending;
    }
    return {
      async tickets(language, onUpdate) {
        const request = ++generation;
        let receivedProducts = false;
        if (!onlineManager.isOnline()) return offlineMavTickets(account.id);
        const snapshot = await wallet.snapshot({
          includeInactive: true,
          includeServices: true,
          language: language === 'hu' ? 'HU' : 'EN',
          onProducts(products) {
            if (request !== generation) return;
            receivedProducts = true;
            // Current passes are usable before archive, service and image requests finish.
            lastProducts = products;
            onUpdate?.(walletTickets(products));
          },
        }).catch(async error => {
          if (!receivedProducts && error instanceof MavMobileError && error.code === 'temporarily-unavailable') {
            const saved = await offlineMavTickets(account.id).catch(() => []);
            if (request === generation && saved.length) onUpdate?.(saved);
            // Keep the error so React Query retries after the provider's cooldown.
          }
          if (!receivedProducts && error instanceof MavMobileError && ['network', 'timeout'].includes(error.code)) {
            const saved = await offlineMavTickets(account.id);
            if (saved.length) return null;
          }
          // An unsuccessful first refresh must not masquerade as an empty wallet.
          throw error;
        });
        if (!snapshot) return offlineMavTickets(account.id);
        if (request === generation) lastProducts = snapshot;
        const products = [...snapshot.tickets, ...snapshot.passes, ...snapshot.unclassified];
        let tickets = walletTickets(snapshot);
        if (request === generation) onUpdate?.(tickets);
        for (const [index, item] of products.entries()) {
          if (request !== generation) return tickets;
          const expiresAt = epochMillis(item.validTo);
          if (!item.canInspect || !item.documentId || expiresAt == null || expiresAt <= Date.now() || !['VALID', 'FUTURE'].includes(item.status)) continue;
          try {
            // A damaged local image must not prevent downloading a replacement.
            const saved = await savedMavPresentation(account.id, item.id).catch(() => null);
            if (saved?.expiresAt !== expiresAt) {
              const html = await download(item);
              if (request !== generation) return tickets;
              await saveMavPresentation(account.id, item.id, { title: item.name, html, expiresAt, accountId: account.id });
            }
            tickets = tickets.map((ticket, i) => i === index ? { ...ticket, offlineAvailable: true } : ticket);
          } catch { /* Keep the product available online; retry saving on the next refresh. */ }
        }
        if (request !== generation) return tickets;
        try { await saveMavCatalog(account.id, tickets); }
        catch { tickets = tickets.map(ticket => ({ ...ticket, offlineAvailable: false })); }
        return tickets;
      },
      async inspector(ticketId, language) {
        const saved = await offlineMavPresentation(account.id, ticketId).catch(() => null);
        if (saved) return saved;
        const snapshot = lastProducts ?? await wallet.snapshot({ includeInactive: true,
          language: language === 'hu' ? 'HU' : 'EN' });
        const product = [...snapshot.tickets, ...snapshot.passes, ...snapshot.unclassified].find(item => item.id === ticketId);
        if (!product?.documentId || !product.canInspect) throw new MavMobileError('unavailable', 'Ticket image unavailable');
        const archive = product.status !== 'VALID';
        const validTo = epochMillis(product.validTo);
        const expiresAt = archive ? Date.now() + 600_000 : Math.min(validTo ?? Date.now() + 600_000, Date.now() + 600_000);
        let html = await download(product);
        if (archive) html = html.replace('<main>', `<main><p style="padding:12px;color:#a32020;font-weight:bold;text-align:center">${language === 'hu' ? 'Csak előnézet – nem érvényes utazásra' : 'Preview only – not valid for travel'}</p>`);
        return { title: product.name, html, expiresAt, accountId: account.id };
      },
    };
  },
};
