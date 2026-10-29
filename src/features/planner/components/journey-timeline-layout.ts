import { usePanelDimensions } from '~/components/panels/PanelLayout';

/** Keep the time/spine alignment across stops, ride bodies, and transfer waits. */
export function useJourneyTimelineLayout() {
  const { fontScale, width } = usePanelDimensions();
  const stacked = fontScale > 1.5 || width < 340;
  return { stacked, timeWidth: stacked ? 0 : Math.ceil(66 * fontScale) };
}
