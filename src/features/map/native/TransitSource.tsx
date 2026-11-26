import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { useMemo, type ComponentProps } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import { POINTER_IMAGE_UNIT } from '../marker-heading';
import { transitLayers } from '../map-model';

type SourceId = 'paths' | 'stops' | 'vehicles' | 'symbols' | 'location';
type TransitSourceProps = Omit<ComponentProps<typeof GeoJSONSource>, 'id' | 'children'> & {
  id: SourceId;
  bearing?: number;
};

export function TransitSource({ id, bearing = 0, data, ...props }: TransitSourceProps) {
  const sourceData = useMemo(() => {
    if (id !== 'vehicles' || !data || typeof data !== 'object' || data.type !== 'FeatureCollection') return data;
    const vehicles = data as FeatureCollection<Point>;
    return { ...vehicles, features: vehicles.features.map((feature) => {
      const p = feature.properties!;
      const edge = p.size * 0.375;
      return { ...feature, properties: { ...p,
        nativeHeadingOffset: [0, -edge * POINTER_IMAGE_UNIT / p.headingSize],
      } };
    }) };
  }, [id, data]);
  return (
    <GeoJSONSource id={id} {...props} data={sourceData}>
      {transitLayers
        .filter((layer) => 'source' in layer && layer.source === id)
        .map((layer) => {
          if (layer.type === 'symbol' && (layer.id === 'vehicle-headings' || layer.id === 'vehicle-heading-outlines'))
            return <Layer key={layer.id} {...layer} layout={{ ...layer.layout, 'icon-offset': ['get', 'nativeHeadingOffset'] }} />;
          return <Layer key={layer.id} {...layer} />;
        })}

    </GeoJSONSource>
  );
}
