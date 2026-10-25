export function mapRenderer(
  isExpoGo: boolean,
  hasMapLibre: boolean,
  apple3D = false,
): 'apple' | 'expo-go' | 'maplibre' | 'unavailable' {
  if (apple3D) return 'apple';
  if (isExpoGo) return 'expo-go';
  return hasMapLibre ? 'maplibre' : 'unavailable';
}
