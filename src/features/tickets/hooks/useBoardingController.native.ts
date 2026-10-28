import { bkkEnabled, createBkkBackend } from '~/lib/transit/adapters/bkk/client';
import { isBkkId } from '~/lib/transit/adapters/bkk/normalize';
import { providerById } from '~/lib/tickets/providers.native';
import { getTransit } from '~/lib/transit/service';
import { boardingTargetForTrip } from '~/lib/tickets/boarding-target';
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
      const available = await loadWalletTickets(cache, language, {
        providerIds: request.providerIds, capability: request.scannedCode ? 'scan' : 'boarding',
      });
      const candidates = boardingTickets(available, { ...request, service: undefined });
      if (!candidates.length) {
        router.push('/tickets');
        return;
      }
      let resolved = request;
      if (request.trip && !request.target && !request.scannedCode) {
        const bkk = isBkkId(request.trip.id) && bkkEnabled() ? createBkkBackend() : null;
        let target = boardingTargetForTrip(request, bkk?.knownPositions() ?? []);
        if (!target) {
          // Boarding needs a plate, not national timetable metadata. Avoid waiting for both APIs.
          const trip = bkk ? await bkk.trip(request.trip.id, request.trip.serviceDay)
            : await getTransit(AbortSignal.timeout(20_000), language).trip(request.trip.id, request.trip.serviceDay);
          target = boardingTargetForTrip(request, trip?.vehiclePositions ?? []);
        }
        if (!target) throw new TicketWalletError('vehicle-unavailable');
        resolved = { ...request, target };
      }
      const supported = await Promise.all(candidates.map(async (ticket) => {
        if (!resolved.service || providerById(ticket.providerId).supportsService?.(resolved.service)) return true;
        const target = resolved.target as { kind?: string; licensePlate?: string } | undefined;
        return target?.kind === 'vehicle' && !!target.licensePlate &&
          await backendFor(ticket.accountId).supportsVehicle?.(target.licensePlate) === true;
      }));
      const tickets = candidates.filter((_, index) => supported[index]);
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
      if (chosen) await execute(chosen, resolved);
      else setPicker({ tickets, request: resolved });
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
