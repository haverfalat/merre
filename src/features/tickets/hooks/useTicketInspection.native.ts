import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from '~/hooks/useTranslation';
import { backendFor } from '~/lib/tickets/accounts.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import { openTicketPresentation } from '~/lib/tickets/presentation.native';
import type { OwnedWalletTicket } from '~/lib/tickets/types';
import { useTicketOperation } from './useTicketOperation.native';

export function useTicketInspection() {
  const cache = useQueryClient();
  const { language } = useTranslation();
  const { busy, loading, error, setError, acquire, release } = useTicketOperation();
  const inspect = async (ticket: OwnedWalletTicket) => {
    if (!acquire(`${ticket.accountId}:${ticket.id}`)) return;
    try {
      const presentation = await backendFor(ticket.accountId).inspector?.(ticket.id, language);
      if (!presentation) throw new TicketWalletError('unavailable');
      const id = openTicketPresentation(presentation);
      router.push({ pathname: '/tickets/present', params: { id } });
      void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
    } catch (error) {
      setError(error);
    } finally {
      release();
    }
  };
  return { inspect, loading, busy, error };
}
