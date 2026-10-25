import { getBasemap, type MapStyle } from '@/lib/basemaps';
import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-react-native';

export function tileUrl(url: string, native: boolean) {
  if (!native || !url.startsWith('/api/map/google?')) return url;
  return url.replace('/api/map/google?style=', 'https://mt.google.com/vt?lyrs=') + '&hl=hu';
}

export function basemapStyle(
  style: MapStyle,
  theme: 'dark' | 'light',
  native: boolean,
  revision = 0,
): StyleSpecification {
  const map = getBasemap(style);
  const dark = style === 'dark' || (style === 'auto' && theme === 'dark');
  return {
    version: 8,
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: Object.fromEntries(
      map.sources.map((source, i) => [
        `base-${revision}-${i}`,
        {
          type: 'raster',
          tiles: [tileUrl(source.url, native)],
          tileSize: 256,
          maxzoom: source.maxZoom,
          attribution: map.credits.map((c) => `<a href="${c.url}">${c.label}</a>`).join(' · '),
        },
      ]),
    ),
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': dark ? '#0c0e13' : '#f1f5f9' },
      },
      ...map.sources.map(
        (_, i): LayerSpecification => ({
          id: `base-${revision}-${i}`,
          type: 'raster',
          source: `base-${revision}-${i}`,
          paint: dark
            ? {
                'raster-saturation': -1,
                'raster-brightness-min': 0.72,
                'raster-brightness-max': 0.03,
                'raster-contrast': 0,
                'raster-fade-duration': 150,
              }
            : { 'raster-fade-duration': 150 },
        }),
      ),
    ],
  };
}
