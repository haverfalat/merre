import { useMapStore } from '@/store/useMapStore';
import type { Feature } from 'geojson';
import { dismissStopPreview, useStopPreview } from '~/store/useStopPreview';

export function selectOverlappingStops(features: Feature[], selected: Feature, select = selectMapFeature) {
  select(selected);
  if (typeof selected.properties?.legIndex === 'number') return;
  const stops = new Map(features.filter(feature => feature.properties?.kind === 'stop' &&
    feature.properties.stopId && feature.geometry.type === 'Point').map(feature => {
      const p = feature.properties!;
      return [p.stopId, { id: String(p.stopId), name: p.name || p.label || '',
        coordinates: (feature.geometry as GeoJSON.Point).coordinates.slice(0, 2) as [number, number] }] as const;
    }));
  if (stops.size > 1) useStopPreview.setState({ alternatives: [...stops.values()] });
}

export function selectMapFeature(feature: Feature) {
  const properties = feature.properties;
  const store = useMapStore.getState();
  if (properties?.kind === 'vehicle' && properties.tripId) {
    dismissStopPreview();
    store.setSelectedVehicle({
      kind: 'vehicle',
      tripId: properties.tripId,
      vehicleId: properties.vehicleId || undefined,
      frontDoor: !!properties.frontDoor,
      serviceDay: properties.serviceDay || undefined,
    });
  }
  if (properties?.kind === 'stop' && properties.stopId && feature.geometry.type === 'Point') {
    store.clearSelection();
    useStopPreview.setState({
      alternatives: [],
      stop: {
        id: properties.stopId,
        name: properties.name || properties.label || '',
        coordinates: feature.geometry.coordinates.slice(0, 2) as [number, number],
      },
      point: null,
      board: null,
    });
  }
}
