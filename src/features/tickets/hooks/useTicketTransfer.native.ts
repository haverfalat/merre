import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useTranslation } from '~/hooks/useTranslation';
import { backendFor } from '~/lib/tickets/accounts.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import type { OwnedWalletTicket } from '~/lib/tickets/types';
import { useTicketOperation } from './useTicketOperation.native';

export function useTicketTransfer() {
  const { t } = useTranslation();
  const cache = useQueryClient();
  const { busy, loading, error, setError, acquire, release } = useTicketOperation();
  const run = async (ticket: OwnedWalletTicket, allowMutation: boolean) => {
    if (!acquire(`${ticket.accountId}:${ticket.id}`)) return;
    try {
      const result = await backendFor(ticket.accountId).transfer?.(ticket.id, { allowMutation });
      if (!result) throw new TicketWalletError('unavailable');
      await cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
      void cache.invalidateQueries({
        queryKey: ['ticket-wallet'],
        predicate: (query) => query.queryKey[1] !== ticket.accountId,
      });
      Alert.alert(
        t(
          result.status === 'completed'
            ? 'tickets_transfer_done'
            : result.status === 'pending'
              ? 'tickets_transfer_pending'
              : result.status === 'failed'
                ? 'tickets_transfer_failed'
                : 'tickets_transfer_unknown',
        ),
      );
    } catch (error) {
      setError(error);
      void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
    } finally {
      release();
    }
  };
  const transfer = (ticket: OwnedWalletTicket) => {
    if (busy) return;
    if (ticket.transferState === 'pending' || ticket.transferState === 'unknown') {
      void run(ticket, false);
      return;
    }
    const remaining =
      ticket.remainingTransfers == null
        ? ''
        : ` ${t('tickets_transfer_remaining', { count: ticket.remainingTransfers })}`;
    Alert.alert(
      t('tickets_transfer_title'),
      t('tickets_transfer_confirm', { name: ticket.name }) + remaining +
        (ticket.transferState === 'retryable' ? ` ${t('tickets_transfer_retry_unknown')}` : ''),
      [
        { text: t('tickets_cancel'), style: 'cancel' },
        { text: t('tickets_transfer'), onPress: () => void run(ticket, true) },
      ],
    );
  };
  return { transfer, loading, error, busy };
}
