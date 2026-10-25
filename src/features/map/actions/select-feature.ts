import { useMapStore } from '@/store/useMapStore';
import type { Feature } from 'geojson';
import { dismissStopPreview, useStopPreview } from '~/store/useStopPreview';

export function selectMapFeature(feature: Feature) {
  const properties = feature.properties;
  const store = useMapStore.getState();
  if (properties?.kind === 'vehicle' && properties.tripId) {
    dismissStopPreview();
    store.setSelectedVehicle({
      tripId: properties.tripId,
      vehicleId: properties.vehicleId || undefined,
      frontDoor: !!properties.frontDoor,
      serviceDay: properties.serviceDay || undefined,
    });
  }
  if (properties?.kind === 'stop' && properties.stopId && feature.geometry.type === 'Point') {
    store.clearSelection();
    useStopPreview.setState({
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
