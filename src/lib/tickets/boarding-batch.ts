import { isBoardableTicket } from './eligibility';
import { TicketWalletError } from './errors';
import type { OwnedWalletTicket, TicketPresentation } from './types';

/** Each purchase is submitted once, in order. Never replace or retry a failed ticket. */
export async function presentBoardingTickets(
  tickets: OwnedWalletTicket[],
  present: (ticket: OwnedWalletTicket) => Promise<TicketPresentation>,
  onAttempt: (ticket: OwnedWalletTicket) => void,
) {
  const keys = tickets.map(ticket => JSON.stringify([ticket.accountId, ticket.id]));
  if (!tickets.length || new Set(keys).size !== tickets.length || tickets.some(ticket => !isBoardableTicket(ticket)))
    throw new TicketWalletError('unavailable');
  const presentations: TicketPresentation[] = [];
  let error: unknown = null;
  for (const ticket of tickets) {
    try {
      presentations.push(await present(ticket));
    } catch (cause) {
      error = cause;
      break;
    } finally {
      onAttempt(ticket);
    }
  }
  return { presentations, error, total: tickets.length };
}
