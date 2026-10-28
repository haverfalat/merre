export function getDelayFromVehiclePosition(
  vp:
    | {
        prevOrCurrentStop?: {
          departureDelay?: number | null;
          arrivalDelay?: number | null;
        } | null;
        nextStop?: {
          arrivalDelay?: number | null;
        } | null;
      }
    | null
    | undefined,
): number | null {
  return (
    vp?.prevOrCurrentStop?.departureDelay ??
    vp?.prevOrCurrentStop?.arrivalDelay ??
    vp?.nextStop?.arrivalDelay ??
    null
  );
}

export type DelayStatus = 'on_time' | 'minor_delay' | 'major_delay' | 'early' | 'unknown';

export const DELAY_STATUS_COLORS: Record<DelayStatus, string> = {
  major_delay: '#f87171',
  minor_delay: '#fbbf24',
  early: '#38bdf8',
  on_time: '#34d399',
  unknown: '#64748b',
};

export interface FormattedDelay {
  text: string;
  minutes: number;
  status: DelayStatus;
  badgeClass: string;
  colorHex: string;
}

export function formatDelay(delaySeconds: number | null | undefined): FormattedDelay {
  if (delaySeconds == null || !Number.isFinite(delaySeconds)) {
    return {
      text: '-',
      minutes: 0,
      status: 'unknown',
      badgeClass: 'bg-(--surface-3) text-(--text-muted) border-(--border)',
      colorHex: DELAY_STATUS_COLORS.unknown,
    };
  }
  const minutes = Math.round(delaySeconds / 60);
  if (minutes < -1) {
    return {
      text: `${minutes}m`,
      minutes,
      status: 'early',
      badgeClass: 'bg-(--accent-muted) text-(--accent) border-(--accent)/30',
      colorHex: DELAY_STATUS_COLORS.early,
    };
  }
  if (minutes <= 2) {
    return {
      text: minutes > 0 ? `+${minutes}m` : '',
      minutes: Math.max(0, minutes),
      status: 'on_time' as DelayStatus,
      badgeClass: 'bg-(--success-muted) text-(--success) border-(--success)/30',
      colorHex: DELAY_STATUS_COLORS.on_time,
    };
  }
  if (minutes <= 4) {
    return {
      text: `+${minutes}m`,
      minutes,
      status: 'minor_delay' as DelayStatus,
      badgeClass: 'bg-(--warning-muted) text-(--warning) border-(--warning)/30',
      colorHex: DELAY_STATUS_COLORS.minor_delay,
    };
  }
  return {
    text: `+${minutes}m`,
    minutes,
    status: 'major_delay' as DelayStatus,
    badgeClass: 'bg-(--danger-muted) text-(--danger) border-(--danger)/30',
    colorHex: DELAY_STATUS_COLORS.major_delay,
  };
}
