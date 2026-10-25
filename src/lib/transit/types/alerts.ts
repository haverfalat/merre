import type { ISODate } from './common';

export type AlertCause =
  | 'UNKNOWN_CAUSE'
  | 'OTHER_CAUSE'
  | 'TECHNICAL_PROBLEM'
  | 'STRIKE'
  | 'DEMONSTRATION'
  | 'ACCIDENT'
  | 'HOLIDAY'
  | 'WEATHER'
  | 'MAINTENANCE'
  | 'CONSTRUCTION'
  | 'POLICE_ACTIVITY'
  | 'MEDICAL_EMERGENCY';

export type AlertEffect =
  | 'UNKNOWN_EFFECT'
  | 'NO_SERVICE'
  | 'REDUCED_SERVICE'
  | 'SIGNIFICANT_DELAYS'
  | 'DETOUR'
  | 'ADDITIONAL_SERVICE'
  | 'MODIFIED_SERVICE'
  | 'OTHER_EFFECT'
  | 'CANCELLATION'
  | 'ADDITIONAL_DEPARTURES'
  | 'IMPORTANT_CHANGES'
  | 'PLACEMENT_CHANGE'
  | 'ACCESSIBILITY_ISSUE';

export type AlertSeverityLevel = 'UNKNOWN' | 'INFO' | 'WARNING' | 'SEVERE';

export interface AlertTranslation {
  text: string;
  language?: string;
}

export interface Alert {
  alertHash: string | null;
  alertUrl: string | null;
  alertCause: AlertCause | null;
  alertEffect: AlertEffect | null;
  alertHeaderText: string | null;
  alertSeverityLevel: AlertSeverityLevel | null;
  alertDescriptionText: string | null;
  alertUrlTranslations: AlertTranslation[];
  alertHeaderTextTranslations: AlertTranslation[];
  alertDescriptionTextTranslations: AlertTranslation[];
  id: string;
  effectiveStartDate: ISODate | null;
  effectiveEndDate: ISODate | null;
  feed: string | null;
}
