import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { isBoardingChoiceFresh } from '~/lib/tickets/boarding';
import { backendFor } from '~/lib/tickets/accounts.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import { openTicketPresentation } from '~/lib/tickets/presentation.native';
import { loadWalletTickets } from '~/lib/tickets/queries.native';
import {
  boardingTickets,
  lastBoardingTicket,
  matchesTicket,
  rememberBoardingTicket,
  useBoardingBusy,
} from '~/lib/tickets/selection.native';
import type { BoardingRequest, OwnedWalletTicket } from '~/lib/tickets/types';

export function useBoardingController() {
  const cache = useQueryClient();
  const { language } = useTranslation();
  const busy = useBoardingBusy((state) => state.busy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [picker, setPicker] = useState<{
    tickets: OwnedWalletTicket[];
    request: BoardingRequest;
  } | null>(null);
  const suppressed = useRef(false);
  const acquire = () => {
    if (useBoardingBusy.getState().busy) return false;
    useBoardingBusy.setState({ busy: true });
    setLoading(true);
    setError(null);
    return true;
  };
  const release = () => {
    useBoardingBusy.setState({ busy: false });
    setLoading(false);
  };
  const execute = async (ticket: OwnedWalletTicket, request: BoardingRequest) => {
    const reference = { accountId: ticket.accountId, ticketId: ticket.id };
    if (!request.target && !request.scannedCode) {
      await rememberBoardingTicket(reference);
      setPicker(null);
      router.push({
        pathname: '/tickets/nearby',
        params: {
          account: ticket.accountId,
          ticket: ticket.id,
          ...(request.route ? { route: request.route } : {}),
        },
      });
      return;
    }
    const backend = backendFor(ticket.accountId);
    const result = request.scannedCode
      ? await backend.scan?.(ticket.id, request.scannedCode, language)
      : await backend.boarding?.(ticket.id, request.target, language);
    if (!result) throw new TicketWalletError('unavailable');
    await rememberBoardingTicket(reference);
    setPicker(null);
    const id = openTicketPresentation(result);
    if (request.scannedCode)
      router.replace({ pathname: '/tickets/present', params: { id, returnTo: 'tickets' } });
    else router.push({ pathname: '/tickets/present', params: { id } });
    void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
  };
  const start = async (request: BoardingRequest, force = false) => {
    if (!acquire()) return;
    try {
      if (!isBoardingChoiceFresh(request)) throw new TicketWalletError('unavailable');
      const tickets = boardingTickets(await loadWalletTickets(cache, language), request);
      if (!tickets.length) {
        router.push('/tickets');
        return;
      }
      const previous = request.preferredTicket ?? (await lastBoardingTicket());
      const chosen =
        tickets.length === 1
          ? tickets[0]
          : force
            ? undefined
            : tickets.find((ticket) => matchesTicket(ticket, previous));
      if (chosen) await execute(chosen, request);
      else setPicker({ tickets, request });
    } catch (error) {
      setError(error);
    } finally {
      release();
    }
  };
  const choose = async (ticket: OwnedWalletTicket) => {
    if (!picker || !acquire()) return;
    try {
      await execute(ticket, picker.request);
    } catch (error) {
      setError(error);
    } finally {
      release();
    }
  };
  return {
    busy,
    loading,
    error,
    picker,
    start,
    choose,
    clearError: () => setError(null),
    closePicker: () => {
      if (!busy) {
        setPicker(null);
        setError(null);
      }
    },
    pressHandlers: (request: BoardingRequest) => ({
      onPressIn: () => {
        suppressed.current = false;
      },
      onLongPress: () => {
        suppressed.current = true;
        void start(request, true);
      },
      onPress: () => {
        if (!suppressed.current) void start(request);
      },
    }),
  };
}
