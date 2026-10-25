export type TimelinePosition = 'first' | 'middle' | 'last' | 'only';
export type TimelineVehicle =
  | { kind: 'at-stop' }
  | { kind: 'between'; fraction: number; label: string };
export interface TimelineAppearance {
  tone: 'default' | 'passed' | 'canceled';
  emphasis: 'normal' | 'strong';
}

export function timelinePosition(index: number, count: number): TimelinePosition {
  return count === 1 ? 'only' : index === 0 ? 'first' : index === count - 1 ? 'last' : 'middle';
}
