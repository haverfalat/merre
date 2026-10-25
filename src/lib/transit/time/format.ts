export function formatTimeOfDay(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return '';
  sec = ((sec % 86400) + 86400) % 86400;
  const hours = Math.floor(sec / 3600) % 24;
  const mins = Math.floor((sec % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
