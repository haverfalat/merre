export function formatTimeOfDay(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return '';
  sec = ((sec % 86400) + 86400) % 86400;
  const hours = Math.floor(sec / 3600) % 24;
  const mins = Math.floor((sec % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

type DurationTranslator = (
  key: 'duration_minutes' | 'duration_hours' | 'duration_hours_minutes',
  params: Record<string, number>,
) => string;

export function formatDuration(minutes: number, translate: DurationTranslator): string {
  if (!Number.isFinite(minutes)) return '';
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  if (!hours) return translate('duration_minutes', { minutes: total });
  if (!remaining) return translate('duration_hours', { hours });
  return translate('duration_hours_minutes', { hours, minutes: remaining });
}
