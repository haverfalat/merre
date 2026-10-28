import type { WalletTicket } from './types';

export function needsTicketActivation(ticket: Pick<WalletTicket, 'status'>): boolean {
  return ticket.status === 'START_ON_VALIDATION';
}

export function isWalletTicketAvailable(ticket: Pick<WalletTicket, 'status'>): boolean {
  return ['VALID', 'FUTURE_VALID', 'START_ON_VALIDATION'].includes(ticket.status);
}

export function isBoardableTicket(ticket: WalletTicket): boolean {
  return ticket.bound && ticket.canBoard &&
    (ticket.status === 'VALID' || needsTicketActivation(ticket));
}
