import type { TransitIntent } from '~/hooks/useTransitPrefetch';
import { themes } from '~/lib/theme';
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
  prefetch: (intent: TransitIntent) => void,
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
  const tooltip = new Popup({ closeButton: false, closeOnClick: false, offset: 12, className: 'merre-map-tooltip' });
  let hoverKey = '';
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  const clearHover = () => { clearTimeout(hoverTimer); hoverKey = ''; tooltip.remove(); };
  instance.on('movestart', clearHover);
  instance.on('remove', clearHover);
  instance.on('mousemove', (event) => {
    const layers = ['vehicle-labels', 'vehicle-symbols', 'vehicles', 'stops'].filter((id) =>
      instance.getLayer(id),
    );
    const feature = layers.length
      ? instance.queryRenderedFeatures(event.point, { layers })[0]
      : undefined;
    instance.getCanvas().style.cursor = feature ? 'pointer' : '';
    if (feature && window.matchMedia('(pointer: fine)').matches) {
      const p = feature.properties;
      const intent: TransitIntent | null = p?.kind === 'stop' && p.stopId
        ? { kind: 'stop', id: p.stopId } : p?.tripId
          ? { kind: 'trip', id: p.tripId, day: p.serviceDay || undefined } : null;
      const key = JSON.stringify(intent);
      if (key !== hoverKey) {
        clearTimeout(hoverTimer);
        hoverKey = key;
        if (intent) hoverTimer = setTimeout(() => prefetch(intent), 180);
      }
      const label = document.createElement('span');
      const text = feature.properties?.name || feature.properties?.hoverLabel ||
        (!feature.properties?.symbol ? feature.properties?.displayLabel : '') || '';
      if (!String(text).trim()) { tooltip.remove(); return; }
      label.textContent = String(text);
      const colors = themes[useUIStore.getState().theme];
      label.style.cssText = `display:block;color:${colors.text};background:${colors.card};font:500 13px/18px system-ui,sans-serif;padding:8px 10px;white-space:normal;overflow-wrap:anywhere`;
      tooltip.setLngLat(event.lngLat).setDOMContent(label).addTo(instance);
      tooltip.getElement()?.style.setProperty('--tooltip-background', colors.card);
    } else clearHover();
  });
  instance.on('mouseout', clearHover);
}
