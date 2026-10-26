import {
  MobileWallet,
  importWalletProfile,
  parseWalletProfile,
  type MobileWalletPresentation,
} from 'budapestgo-api/mobile';
import { accountTicketStore, loadTicketFonts, ticketCrypto } from '../platform.native';
import type { TicketProvider } from '../types';

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
    const profile = parseWalletProfile(payload);
    return `${profile.installation.applicationId}:${profile.owner?.sub ?? ''}`;
  },
  async importAccount(payload) {
    const profile = await importWalletProfile(payload, ticketCrypto);
    return {
      label: profile.owner.email ?? profile.owner.name ?? 'BudapestGO',
      payload: profile,
      identity: profile.installation.applicationId,
    };
  },
  connect(account, persist) {
    const wallet = new MobileWallet({
      profile: account.payload,
      crypto: ticketCrypto,
      persist,
      store: accountTicketStore(account.id, ['boarding-history']),
      historyScope: account.id,
      fonts: loadTicketFonts,
    });
    const presentation = (result: Promise<MobileWalletPresentation>) =>
      result.then((value) => ({ ...value, accountId: account.id }));
    return {
      tickets: (language) => wallet.tickets(language),
      inspector: (ticketId, language) => presentation(wallet.inspector(ticketId, language)),
      boarding: (ticketId, target, language) =>
        presentation(wallet.boarding(ticketId, target, language)),
      scan: (ticketId, code, language) => presentation(wallet.scan(ticketId, code, language)),
      nearby: (latitude, longitude) => wallet.nearby(latitude, longitude),
      stations: () => wallet.stations(),
    };
  },
};
