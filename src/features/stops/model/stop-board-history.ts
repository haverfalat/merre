import type { StopBoardTab } from '~/store/useStopPreview';

export interface StopBoardView {
  tab: StopBoardTab;
  date: string | null;
  time: string | null;
  range: number;
  timetableRoutes: string[] | null;
  departureRoutes: string[] | null;
  showConnections: boolean;
}

// Keep navigation state per physical stop, independently of the mounted panel.
const history = new Map<string, StopBoardView>();
export function getStopBoardView(id: string) {
  return history.get(id);
}
export function rememberStopBoardView(id: string, view: StopBoardView) {
  history.delete(id);
  history.set(id, view);
  if (history.size > 50) history.delete(history.keys().next().value!);
}
