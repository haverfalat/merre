import { transitLabelParts } from '@/lib/transit-label';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { vehiclePositionKey } from '@/lib/vehicle-position';
import { validCoordinates } from '@/lib/transit';
import { contrastTextColor, getRouteColor } from '@/lib/transit/colors';
import { formatDelay, getDelayFromVehiclePosition } from '@/lib/transit/delay';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import { vehicleMapLabel } from '@/lib/vehicle-map-label';
import { vehicleMarkerAppearance } from '@/lib/vehicle-marker';
import type { FeatureCollection, Point } from 'geojson';
import glyphMetrics from '~/features/map/glyph-metrics.json';
import { hasFrontDoorBoarding } from '~/lib/boarding-policy';

export function vehicleFeatures(
  vehicles: VehiclePosition[],
  selectedTrip?: string,
  zoom = 12,
  focused = false,
  theme: 'dark' | 'light' = 'dark',
): FeatureCollection<Point> {
  const appearance = vehicleMarkerAppearance(zoom, focused, !!selectedTrip);
  return {
    type: 'FeatureCollection',
    features: vehicles
      .filter((v) => validCoordinates(v.lon, v.lat))
      .map((v, i) => {
        const tripId = v.trip?.gtfsId || v.trip?.id || '';
        const label = vehicleMapLabel(v.trip);
        const delay = formatDelay(getDelayFromVehiclePosition(v));
        const symbol = label.mnr ? `mnr-${label.label.codePointAt(0)}` : '';
        const mapLabel = label.mnr ? '' : label.label;
        const color = getRouteColor(
          v.trip?.route?.mode,
          v.trip?.route?.color,
          v.trip?.route?.textColor,
        ).primary;
        const validHeading =
          v.heading != null && Number.isFinite(v.heading) && v.heading >= 0 && v.heading <= 360;
        const showLabel = appearance.showLabel && !!label.label.trim();
        const selected = tripId === selectedTrip;
        const badgeLabel = label.mnr
          ? '0'.repeat(Math.max(1, Math.ceil(Array.from(label.label).reduce(
            (sum, char) => sum + ((glyphMetrics as Record<string, { advance: number }>)[`mnr-${char.codePointAt(0)}`]?.advance ?? 12),
            0,
          ) / 7)))
          : label.label || '•';
        const textLen = Array.from(badgeLabel).length;
        const circleSize = showLabel
          ? textLen <= 2
            ? 23
            : textLen === 3
              ? 25
              : 27
          : appearance.size;
        const labelSize = textLen <= 2 ? 11.5 : textLen === 3 ? 11 : 9.5;
        const headingSize = Math.max(5.5, circleSize * 0.52);
        return {
          type: 'Feature',
          id: v.vehicleId || `${tripId}-${i}`,
          geometry: { type: 'Point', coordinates: [v.lon!, v.lat!] },
          properties: {
            kind: 'vehicle',
            hoverLabel: [cleanTransitLabel(transitLabelParts(v.trip?.tripShortName || v.trip?.route?.shortName || v.trip?.routeShortName || '')
              .filter(part => !part.mnr).map(part => part.text).join('')),
              cleanTransitLabel(v.trip?.tripHeadsign)].filter(Boolean).join(' → '),
            motionKey: vehiclePositionKey(v),
            frontDoor: hasFrontDoorBoarding(v.trip?.tripHeadsign),
            tripId,
            vehicleId: v.vehicleId,
            serviceDay: v.trip?.serviceDate,
            label: symbol ? '' : mapLabel || '•',
            displayLabel: label.label || '•',
            badgeLabel,
            bodyWidth: circleSize,
            bodyHeight: circleSize,
            bodyRadius: circleSize / 2,
            outlineWidth: selected ? 2 : showLabel ? 1.75 : appearance.strokeWidth,
            delayTextColor: contrastTextColor(delay.colorHex),
            symbol,
            ...appearance,
            size: circleSize,
            labelSize,
            headingSize,
            showLabel,
            showHeading: appearance.showHeading && validHeading,
            textColor: contrastTextColor(color),
            outline: theme === 'dark' ? '#ffffff' : '#0f172a',
            delay: delay.minutes > 0 ? `+${delay.minutes}m` : '',
            color,
            delayColor: delay.colorHex,
            heading: v.heading ?? 0,
            selected,
          },
        };
      }),
  };
}

export function vehicleSymbolFeatures(markers: FeatureCollection<Point>): FeatureCollection<Point> {
  const metrics = glyphMetrics as Record<
    string,
    {
      advance: number;
      left: number;
      width: number;
    }
  >;
  return {
    type: 'FeatureCollection',
    features: markers.features.flatMap((feature) => {
      const p = feature.properties!;
      if (!p.symbol || !p.showLabel) return [];
      const parts = Array.from(String(p.displayLabel)).map(
        (character) => `mnr-${character.codePointAt(0)}`,
      );
      const width = parts.reduce((sum, id) => sum + (metrics[id]?.advance || 12), 0);
      let pen = -width / 2;
      return parts.map((id, index) => {
        const metric = metrics[id] || { advance: 12, left: 0, width: 12 };
        const x = pen + metric.left + metric.width / 2;
        pen += metric.advance;
        return {
          ...feature,
          id: `${feature.id}-glyph-${index}`,
          properties: { ...p, symbol: id, symbolOffset: [x * 4, 0] },
        };
      });
    }),
  };
}
