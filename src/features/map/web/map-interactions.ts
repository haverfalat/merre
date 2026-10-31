import { selectOverlappingStops } from '../actions/select-feature';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import type { Map as GLMap, Popup as MapPopup } from 'maplibre-gl';
import type { TransitMapProps } from '~/features/map/TransitMap.types';
import { nearestMapFeature } from '~/features/map/model/hit-testing';
import { dismissStopPreview } from '~/store/useStopPreview';

import type { RefObject } from 'react';

export function installMapInteractions(
  instance: GLMap,
  container: RefObject<HTMLDivElement | null>,
  latest: RefObject<TransitMapProps['data']>,
  Popup: typeof MapPopup,
) {
  const viewport = () => {
    const bounds = instance.getBounds();
    const center = instance.getCenter();
    useMapStore.getState().setViewport(
      {
        swLon: bounds.getWest(),
        swLat: bounds.getSouth(),
        neLon: bounds.getEast(),
        neLat: bounds.getNorth(),
      },
      instance.getZoom(),
      [center.lng, center.lat],
    );
  };
  instance.on('movestart', () => container.current?.setAttribute('data-map-moving', 'true'));
  instance.on('moveend', () => container.current?.setAttribute('data-map-moving', 'false'));
  instance.on('load', viewport);
  instance.on('moveend', viewport);
  instance.on('zoom', () => {
    const zoom = instance.getZoom();
    if (Math.floor(zoom) !== Math.floor(useMapStore.getState().zoom))
      useMapStore.setState({ zoom });
  });
  instance.on('dragstart', () => useMapStore.getState().releaseVehicleCamera());
  instance.on('rotatestart', (e) => {
    if (e.originalEvent) useMapStore.getState().releaseVehicleCamera();
  });
  instance.on('click', (event) => {
    const layers = ['vehicle-labels', 'vehicle-symbols', 'vehicles', 'stops'].filter((id) =>
      instance.getLayer(id),
    );
    const direct = instance.queryRenderedFeatures(event.point, { layers })[0];
    const feature =
      direct ||
      nearestMapFeature(
        instance.queryRenderedFeatures(
          [
            [event.point.x - 12, event.point.y - 12],
            [event.point.x + 12, event.point.y + 12],
          ],
          { layers },
        ),
        [event.point.x, event.point.y],
        (coordinates) => {
          const pixel = instance.project([coordinates[0], coordinates[1]]);
          return [pixel.x, pixel.y];
        },
      );
    if (feature?.properties?.kind === 'stop') {
      const nearby = instance.queryRenderedFeatures([
        [event.point.x - 12, event.point.y - 12],
        [event.point.x + 12, event.point.y + 12],
      ], { layers: ['stops'].filter(id => instance.getLayer(id)) });
      selectOverlappingStops(nearby, feature, latest.current.selectFeature);
    } else if (feature) latest.current.selectFeature(feature);
    else {
      dismissStopPreview();
      if (
        window.innerWidth >= 768 ||
        !(
          useMapStore.getState().selectedVehicle ||
          useMapStore.getState().selectedStopId ||
          useMapStore.getState().selectedRouteId
        )
      )
        useMapStore.getState().clearSelection();
    }
    useUIStore.getState().setSearchFocused(false);
  });
  const tooltip = new Popup({ closeButton: false, closeOnClick: false, offset: 12 });
  instance.on('mousemove', (event) => {
    const layers = ['vehicle-labels', 'vehicle-symbols', 'vehicles', 'stops'].filter((id) =>
      instance.getLayer(id),
    );
    const feature = layers.length
      ? instance.queryRenderedFeatures(event.point, { layers })[0]
      : undefined;
    instance.getCanvas().style.cursor = feature ? 'pointer' : '';
    if (feature && window.matchMedia('(pointer: fine)').matches) {
      const label = document.createElement('span');
      label.textContent = feature.properties?.name || feature.properties?.displayLabel || '';
      if (feature.properties?.symbol) label.style.fontFamily = 'MNR2007';
      tooltip.setLngLat(event.lngLat).setDOMContent(label).addTo(instance);
    } else tooltip.remove();
  });
  instance.on('mouseout', () => tooltip.remove());
}
