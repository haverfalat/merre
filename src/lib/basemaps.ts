import type { TranslationKey } from '@/i18n/dict';

export type MapStyle =
  | 'auto'
  | 'streets'
  | 'dark'
  | 'humanitarian'
  | 'cycling'
  | 'terrain'
  | 'satellite'
  | 'hybrid'
  | 'google-streets'
  | 'google-satellite'
  | 'google-hybrid'
  | 'google-terrain';
type Credit = { label: string; url: string };
type TileSource = { url: string; maxZoom: number };
type Basemap = {
  id: MapStyle;
  name: TranslationKey;
  provider: string;
  sources: TileSource[];
  credits: Credit[];
};
const osmCredit = {
  label: '© OpenStreetMap contributors',
  url: 'https://www.openstreetmap.org/copyright',
};
const franceCredit = {
  label: 'Tiles © OpenStreetMap France',
  url: 'https://www.openstreetmap.fr/fonds-de-carte/',
};
const osm = { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 19 };
const imagery = {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  maxZoom: 19,
};
const imageryCredits = [
  {
    label: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    url: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
  },
];
const googleCredits = [
  {
    label: 'Map data / imagery © Google Maps and imagery providers',
    url: 'https://maps.google.com/',
  },
];
const google = (style: string): TileSource[] => [
  { url: `/api/map/google?style=${style}&z={z}&x={x}&y={y}`, maxZoom: 19 },
];

// Public raster endpoints only. Native zoom limits also allow cached parent tiles
// to remain visible when the user zooms beyond a provider's detail level.
export const BASEMAPS: Basemap[] = [
  {
    id: 'auto',
    name: 'map_style_auto',
    provider: 'OpenStreetMap',
    sources: [osm],
    credits: [osmCredit],
  },
  {
    id: 'streets',
    name: 'map_style_streets',
    provider: 'OpenStreetMap',
    sources: [osm],
    credits: [osmCredit],
  },
  {
    id: 'dark',
    name: 'map_style_dark',
    provider: 'OpenStreetMap',
    sources: [osm],
    credits: [osmCredit],
  },
  {
    id: 'humanitarian',
    name: 'map_style_humanitarian',
    provider: 'HOT · OpenStreetMap France',
    sources: [{ url: 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', maxZoom: 19 }],
    credits: [
      osmCredit,
      franceCredit,
      { label: 'Style: Humanitarian OpenStreetMap Team', url: 'https://www.hotosm.org/' },
    ],
  },
  {
    id: 'cycling',
    name: 'map_style_cycling',
    provider: 'CyclOSM · OpenStreetMap France',
    sources: [
      { url: 'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', maxZoom: 20 },
    ],
    credits: [osmCredit, { label: '© CyclOSM', url: 'https://www.cyclosm.org/' }, franceCredit],
  },
  {
    id: 'terrain',
    name: 'map_style_terrain',
    provider: 'Esri World Hillshade',
    sources: [
      {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 16,
      },
    ],
    credits: [
      {
        label: '© Esri, Airbus DS, USGS, NGA, NASA, CGIAR, GEBCO, and the GIS User Community',
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer',
      },
    ],
  },
  {
    id: 'satellite',
    name: 'map_style_satellite',
    provider: 'Esri World Imagery',
    sources: [imagery],
    credits: imageryCredits,
  },
  {
    id: 'hybrid',
    name: 'map_style_hybrid',
    provider: 'Esri World Imagery + labels',
    sources: [
      imagery,
      {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
      },
    ],
    credits: [
      ...imageryCredits,
      {
        label: 'Labels © Esri and contributors',
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
      },
    ],
  },
  {
    id: 'google-streets',
    name: 'map_style_google_streets',
    provider: 'Google · unofficial',
    sources: google('m'),
    credits: googleCredits,
  },
  {
    id: 'google-satellite',
    name: 'map_style_google_satellite',
    provider: 'Google · unofficial',
    sources: google('s'),
    credits: googleCredits,
  },
  {
    id: 'google-hybrid',
    name: 'map_style_google_hybrid',
    provider: 'Google · unofficial',
    sources: google('y'),
    credits: googleCredits,
  },
  {
    id: 'google-terrain',
    name: 'map_style_google_terrain',
    provider: 'Google · unofficial',
    sources: google('p'),
    credits: googleCredits,
  },
];

export function isMapStyle(value: unknown): value is MapStyle {
  return BASEMAPS.some((style) => style.id === value);
}
export function getBasemap(style: MapStyle) {
  return BASEMAPS.find((map) => map.id === style) ?? BASEMAPS[0];
}
