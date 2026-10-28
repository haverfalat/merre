import { create } from 'zustand';
import { readSecure, writeSecure } from './secure-storage.native';
import type { BoardingRequest, OwnedWalletTicket, TicketReference } from './types';
import { providerById } from './providers.native';
import { isBoardableTicket, needsTicketActivation } from './eligibility';

export const useBoardingBusy = create<{ busy: boolean }>(() => ({ busy: false }));
let remembered: TicketReference | null = null;
let loaded: Promise<void> | null = null;
export async function lastBoardingTicket(): Promise<TicketReference | null> {
  loaded ??= readSecure<TicketReference>('boarding-choice')
    .then((value) => {
      remembered = value;
    })
    .catch((error) => {
      loaded = null;
      throw error;
    });
  await loaded;
  return remembered;
}
export async function rememberBoardingTicket(ticket: TicketReference): Promise<void> {
  await writeSecure('boarding-choice', ticket);
  remembered = ticket;
  loaded = Promise.resolve();
}
export function matchesTicket(
  ticket: OwnedWalletTicket,
  reference: TicketReference | null | undefined,
): boolean {
  return (
    !!reference && ticket.accountId === reference.accountId && ticket.id === reference.ticketId
  );
}
export function boardingTickets(
  tickets: OwnedWalletTicket[],
  request: BoardingRequest,
): OwnedWalletTicket[] {
  return tickets.filter((ticket) => {
    const provider = providerById(ticket.providerId);
    return (
      isBoardableTicket(ticket) &&
      (!request.target || !!request.scannedCode || !needsTicketActivation(ticket)) &&
      provider.capabilities.includes('boarding') &&
      (!request.providerIds || request.providerIds.includes(ticket.providerId)) &&
      (!request.service || provider.supportsService?.(request.service) === true) &&
      (!request.scannedCode || provider.capabilities.includes('scan'))
    );
  });
}
