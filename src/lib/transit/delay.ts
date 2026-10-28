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

const DELAY_STYLES = {
  major_delay: { tone: 'danger', surface: 'dangerMuted', colorHex: '#f87171' },
  minor_delay: { tone: 'warning', surface: 'warningMuted', colorHex: '#fbbf24' },
  early: { tone: 'early', surface: 'earlyMuted', colorHex: '#38bdf8' },
  on_time: { tone: 'success', surface: 'successMuted', colorHex: '#34d399' },
  unknown: { tone: 'secondary', surface: 'surface', colorHex: '#64748b' },
} as const;

export type DelayStatus = keyof typeof DELAY_STYLES;
export type FormattedDelay = {
  minutes: number;
  status: DelayStatus;
} & (typeof DELAY_STYLES)[DelayStatus];

export function formatDelay(delaySeconds: number | null | undefined): FormattedDelay {
  const rounded = delaySeconds != null && Number.isFinite(delaySeconds)
    ? Math.round(delaySeconds / 60) : null;
  const status: DelayStatus = rounded == null ? 'unknown'
    : rounded < -1 ? 'early'
      : rounded <= 2 ? 'on_time'
        : rounded <= 4 ? 'minor_delay' : 'major_delay';
  return {
    minutes: status === 'on_time' ? Math.max(0, rounded ?? 0) : (rounded ?? 0),
    status,
    ...DELAY_STYLES[status],
  };
}

export function delayLabel(
  delay: FormattedDelay,
  t: (key: 'early' | 'delay_min', params: { min: number }) => string,
) {
  return delay.minutes < 0
    ? t('early', { min: Math.abs(delay.minutes) })
    : t('delay_min', { min: delay.minutes });
}
