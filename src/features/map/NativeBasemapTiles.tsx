import { getBasemap, type MapStyle } from '@/lib/basemaps';
import { memo } from 'react';
import { UrlTile } from 'react-native-maps';
import { tileUrl } from '~/features/map/model/basemap-style';

/** Camera/vehicle updates must not rebuild MapKit's raster overlays. */
export const NativeBasemapTiles = memo(function NativeBasemapTiles({
  style,
  dark,
  revision,
}: {
  style: MapStyle;
  dark: boolean;
  revision: number;
}) {
  return (
    <>
      {getBasemap(style).sources.map((source, index) => (
        <UrlTile
          key={`${style}-${revision}-${index}`}
          urlTemplate={tileUrl(source.url, true)}
          maximumZ={20}
          maximumNativeZ={source.maxZoom}
          tileSize={256}
          zIndex={index}
          opacity={dark ? 0.55 : 1}
          shouldReplaceMapContent={index === 0}
        />
      ))}
    </>
  );
});
