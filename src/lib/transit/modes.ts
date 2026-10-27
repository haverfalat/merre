export function isRailMode(mode?: string | null): boolean {
  return mode === 'RAIL' || mode === 'SUBURBAN_RAILWAY';
}

export const TRANSIT_MODE_OPTIONS = [
  ['RAIL', 'rail'],
  ['SUBURBAN_RAILWAY', 'suburban_railway'],
  ['COACH', 'coach'],
  ['BUS', 'bus'],
  ['TRAM', 'tram'],
  ['TRAMTRAIN', 'tramtrain'],
  ['SUBWAY', 'subway'],
  ['TROLLEYBUS', 'trolleybus'],
  ['FERRY', 'ferry'],
  ['RAIL_REPLACEMENT_BUS', 'rail_replacement_bus'],
] as const;
