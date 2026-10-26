import type { BoardingChoice } from './types';
export function isBoardingChoiceFresh(choice: Pick<BoardingChoice, 'queriedAt'>): boolean {
  return (
    choice.queriedAt === undefined ||
    (Date.now() >= choice.queriedAt && Date.now() - choice.queriedAt <= 120_000)
  );
}

export function distanceMeters(
  latitude: number,
  longitude: number,
  latitude2: number,
  longitude2: number,
): number {
  const radians = Math.PI / 180;
  const a =
    Math.sin(((latitude2 - latitude) * radians) / 2) ** 2 +
    Math.cos(latitude * radians) *
      Math.cos(latitude2 * radians) *
      Math.sin(((longitude2 - longitude) * radians) / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
