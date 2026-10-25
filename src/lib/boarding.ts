import { cleanTransitPlaceName } from '@/lib/transit/labels';

const FRONT_DOOR =
  /\[\s*(?:els[őo][ -]?ajt[óo]s(?:\s+felsz[áa]ll[áa]s)?|front[ -]door(?:\s+boarding)?)\s*\]/giu;

export function destinationBoarding(raw: string) {
  const headsign = raw.replace(FRONT_DOOR, '').trim();
  return {
    headsign,
    frontDoor: headsign !== raw.trim(),
    // Markup, whitespace and the boarding policy do not define a new destination.
    destinationKey: cleanTransitPlaceName(headsign).normalize('NFC').replace(/\s+/g, ' ').trim(),
  };
}
