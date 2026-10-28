/** Identify BKK consistently from either route IDs or agency metadata. */
export function isBkkRoute(route: {
  id?: string | null;
  gtfsId?: string | null;
  agency?: { id?: string | null; gtfsId?: string | null; name?: string | null } | null;
} | null | undefined): boolean {
  if (!route) return false;
  const agency = `${route.agency?.name ?? ''} ${route.agency?.id ?? ''} ${route.agency?.gtfsId ?? ''}`;
  return (
    /(^|[^a-z])bkk([^a-z]|$)|budapesti k[oö]zleked[eé]si k[oö]zpont/i.test(agency) ||
    /^BKK[:_]/i.test(route.gtfsId ?? route.id ?? '')
  );
}
