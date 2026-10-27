import { budapestGoProvider } from './providers/budapestgo.native';
import { mavProvider } from './providers/mav.native';
import { TicketWalletError } from './errors';
import type { TicketProvider } from './types';

export const ticketProviders: readonly TicketProvider[] = [budapestGoProvider, mavProvider];
export function providerById(id: string): TicketProvider {
  const provider = ticketProviders.find((provider) => provider.id === id);
  if (!provider) throw new TicketWalletError('import');
  return provider;
}
