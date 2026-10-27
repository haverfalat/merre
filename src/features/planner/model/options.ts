import type { JourneyPreferences } from '~/lib/transit/types/plan';
import { TRANSIT_MODE_OPTIONS } from '~/lib/transit/modes';

export function defaultJourneyPreferences(): JourneyPreferences {
  return {
    modes: TRANSIT_MODE_OPTIONS.map(([mode]) => mode),
    walkSpeed: 5 / 3.6,
    minTransferTime: 0,
    wheelchair: false,
    comfortLevels: [],
    searchParameters: [],
    transitPassFilter: [],
  };
}
export function preferenceCount(options: JourneyPreferences) {
  return (
    Number(options.modes.length !== defaultJourneyPreferences().modes.length) +
    Number(options.walkSpeed !== 5 / 3.6) +
    Number(options.minTransferTime !== 0) +
    Number(options.wheelchair) +
    options.comfortLevels.length +
    options.searchParameters.length +
    options.transitPassFilter.length
  );
}
export function toggleOption(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
