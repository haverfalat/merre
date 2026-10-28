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
import { openTicketPresentations } from '~/lib/tickets/presentation.native';
import { presentBoardingTickets } from '~/lib/tickets/boarding-batch';
import { needsTicketActivation } from '~/lib/tickets/eligibility';
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
    selected: OwnedWalletTicket[];
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
  const execute = async (tickets: OwnedWalletTicket[], request: BoardingRequest, confirmed = false) => {
    const ticket = tickets[0];
    if (!ticket) throw new TicketWalletError('unavailable');
    const reference = { accountId: ticket.accountId, ticketId: ticket.id };
    if ((!request.target && !request.scannedCode) ||
      (tickets.some(needsTicketActivation) && !request.scannedCode)) {
      await rememberBoardingTicket(reference);
      setPicker(null);
      router.push({
        pathname: needsTicketActivation(ticket) ? '/tickets/scan' : '/tickets/nearby',
        params: {
          account: ticket.accountId,
          ticket: ticket.id,
          ...(request.route ? { route: request.route } : {}),
        },
      });
      return;
    }
    if (tickets.some(needsTicketActivation) && !confirmed)
      throw new TicketWalletError('unavailable');
    const result = await presentBoardingTickets(tickets, async (item) => {
      const backend = backendFor(item.accountId);
      const options = { allowActivation: confirmed };
      const presentation = request.scannedCode
        ? await backend.scan?.(item.id, request.scannedCode, language, options)
        : await backend.boarding?.(item.id, request.target, language, options);
      if (!presentation) throw new TicketWalletError('unavailable');
      return presentation;
    }, item => { void cache.invalidateQueries({ queryKey: ['ticket-wallet', item.accountId] }); });
    if (!result.presentations.length) {
      // The request may have reached the server. Close the selection rather than offering a blind retry.
      setPicker(null);
      throw new TicketWalletError('validation-uncertain');
    }
    await rememberBoardingTicket(reference).catch(() => {});
    setPicker(null);
    const id = openTicketPresentations(result.presentations, result.error
      ? { completed: result.presentations.length, total: result.total } : null);
    if (request.scannedCode)
      router.replace({ pathname: '/tickets/present', params: { id, returnTo: 'tickets' } });
    else router.push({ pathname: '/tickets/present', params: { id } });
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
      const tickets = candidates.filter((ticket, index) => supported[index] &&
        (!resolved.target || !!resolved.scannedCode || !needsTicketActivation(ticket)));
      if (!tickets.length) {
        router.push('/tickets');
        return;
      }
      const previous = request.preferredTicket ?? (await lastBoardingTicket());
      if (request.preferredTicket && !tickets.some(ticket => matchesTicket(ticket, request.preferredTicket)))
        throw new TicketWalletError('unavailable');
      const chosen =
        request.preferredTicket
          ? tickets.find(ticket => matchesTicket(ticket, request.preferredTicket))
          : tickets.length === 1
          ? tickets[0]
          : force
            ? undefined
            : tickets.find((ticket) => matchesTicket(ticket, previous));
      const confirm = !!resolved.scannedCode &&
        (tickets.length > 1 || tickets.some(needsTicketActivation));
      if (chosen && !confirm) await execute([chosen], resolved);
      else setPicker({ tickets, request: resolved, selected: chosen ? [chosen] : [] });
    } catch (error) {
      setError(error);
    } finally {
      release();
    }
  };
  const choose = async (ticket: OwnedWalletTicket) => {
    if (!picker || !acquire()) return;
    try {
      await execute([ticket], picker.request);
    } catch (error) {
      setError(error);
    } finally {
      release();
    }
  };
  const toggle = (ticket: OwnedWalletTicket) => {
    if (busy) return;
    setPicker(current => current ? {
      ...current,
      selected: current.selected.some(item => item.accountId === ticket.accountId && item.id === ticket.id)
        ? current.selected.filter(item => item.accountId !== ticket.accountId || item.id !== ticket.id)
        : [...current.selected, ticket],
    } : null);
  };
  const confirm = async () => {
    if (!picker?.selected.length || !acquire()) return;
    try { await execute(picker.selected, picker.request, true); }
    catch (error) { setError(error); }
    finally { release(); }
  };
  return {
    busy,
    loading,
    error,
    picker,
    start,
    choose,
    toggle,
    confirm,
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
