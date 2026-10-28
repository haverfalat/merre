import { Asset } from 'expo-asset';
import type { Map as GLMap } from 'maplibre-gl';
import { glyphAssets } from '~/features/map/glyph-assets';
import {
  BEARING_ARROW_IMAGE,
  bearingArrowAsset,
  LOCATION_HEADING_IMAGE,
  locationHeadingAsset,
  VEHICLE_BADGE_IMAGE,
  vehicleBadgeAsset,
} from '~/features/map/marker-assets';
import { stopRingImage } from '~/features/map/stop-sprite';

export function installMapImages(instance: GLMap, isDisposed: () => boolean) {
  const loadingImages = new globalThis.Map<string, Promise<void>>();
  instance.setMissingStyleImageResolver((id) => {
    const badge = id === VEHICLE_BADGE_IMAGE;
    const arrow = id === BEARING_ARROW_IMAGE;
    const ring = id.startsWith('stop-ring:') ? stopRingImage(id) : null;
    const asset = badge
      ? vehicleBadgeAsset
      : arrow
        ? bearingArrowAsset
        : id === LOCATION_HEADING_IMAGE
          ? locationHeadingAsset
          : glyphAssets[id];
    if (!asset && !ring) return;
    const pending = loadingImages.get(id);
    if (pending) return pending;
    const request = instance
      .loadImage(ring?.uri || Asset.fromModule(asset).uri)
      .then(({ data: image }) => {
        if (!isDisposed() && !instance.hasImage(id))
          instance.addImage(
            id,
            image,
            badge ? { sdf: true } : arrow || id.startsWith('mnr-') ? { sdf: true } : {},
          );
      })
      .finally(() => loadingImages.delete(id));
    loadingImages.set(id, request);
    return request;
  });
}
