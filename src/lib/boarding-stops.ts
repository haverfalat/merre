export interface BoardingStop {
  id: string;
  parentStation?: { id: string } | null;
}

export function findBoardingStop<T extends BoardingStop>(
  stops: T[],
  selectedIds: string[],
  origins: BoardingStop[] = [],
): T | undefined {
  const exact = stops.find((stop) => selectedIds.includes(stop.id));
  if (exact) return exact;
  // National feeds use different IDs for a station marker, boarding platform,
  // and the canonical stop in a shape. Join by the API's station relationship.
  const stations = new Set(
    origins
      .filter((stop) => selectedIds.includes(stop.id))
      .flatMap((stop) => [stop.id, ...(stop.parentStation ? [stop.parentStation.id] : [])]),
  );
  return stops.find(
    (stop) =>
      stations.has(stop.id) || (!!stop.parentStation && stations.has(stop.parentStation.id)),
  );
}
