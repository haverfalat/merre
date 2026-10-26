import { create } from 'zustand';
import { newAccountId } from './identity.native';
import type { TicketPresentation } from './types';

interface State {
  id: string | null;
  presentation: TicketPresentation | null;
  monotonicExpiresAt: number;
}
export const useTicketPresentation = create<State>(() => ({
  id: null,
  presentation: null,
  monotonicExpiresAt: 0,
}));
export function openTicketPresentation(presentation: TicketPresentation): string {
  const id = newAccountId();
  useTicketPresentation.setState({
    id,
    presentation,
    monotonicExpiresAt: performance.now() + Math.max(0, presentation.expiresAt - Date.now()),
  });
  return id;
}
export function clearTicketPresentation(id?: string) {
  if (!id || useTicketPresentation.getState().id === id)
    useTicketPresentation.setState({ id: null, presentation: null, monotonicExpiresAt: 0 });
}
