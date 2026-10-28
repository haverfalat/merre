import { create } from 'zustand';
import { newAccountId } from './identity.native';
import type { TicketPresentation } from './types';

interface State {
  id: string | null;
  presentation: TicketPresentation | null;
  monotonicExpiresAt: number;
  items: { presentation: TicketPresentation; monotonicExpiresAt: number }[];
  incomplete: { completed: number; total: number } | null;
}
export const useTicketPresentation = create<State>(() => ({
  id: null,
  presentation: null,
  monotonicExpiresAt: 0,
  items: [],
  incomplete: null,
}));
export function openTicketPresentation(presentation: TicketPresentation): string {
  return openTicketPresentations([presentation]);
}
export function openTicketPresentations(
  presentations: TicketPresentation[],
  incomplete: State['incomplete'] = null,
): string {
  if (!presentations.length) throw new Error('No ticket presentations');
  const id = newAccountId();
  const now = Date.now();
  const elapsed = performance.now();
  const items = presentations.map(presentation => ({
    presentation,
    monotonicExpiresAt: elapsed + Math.max(0, presentation.expiresAt - now),
  }));
  useTicketPresentation.setState({
    id,
    presentation: presentations[0],
    monotonicExpiresAt: items[0].monotonicExpiresAt,
    items,
    incomplete,
  });
  return id;
}
export function clearTicketPresentation(id?: string) {
  if (!id || useTicketPresentation.getState().id === id)
    useTicketPresentation.setState({ id: null, presentation: null, monotonicExpiresAt: 0, items: [], incomplete: null });
}
