/** Screen-pixel sizing shared by MapLibre and the Expo Go renderer. */
export function vehicleMarkerAppearance(zoom: number, focused = false, hasSelection = false) {
  const level = Math.floor(zoom);
  const baseSize = level < 9 ? 7 : level < 11 ? 8 : level < 12 ? 9 : level < 13 ? 10 : 12;
  const size = focused ? Math.max(11, baseSize) : baseSize;
  const showLabel = level >= 14 || hasSelection;
  return {
    size,
    showLabel,
    labelSize: 12,
    strokeWidth: level < 12 ? 1 : 1.5,
    headingSize: showLabel ? 11 : Math.max(8, size * 0.78),
    showHeading: level >= 10 || focused || hasSelection,
    showDelay: level >= 14,
  };
}

/** The map renderers use a 512-pixel world at zoom zero. */
export function vehicleMapZoom(width: number, longitudeDelta: number) {
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(longitudeDelta) ||
    longitudeDelta <= 0
  )
    return null;
  return Math.log2((360 * width) / (512 * longitudeDelta));
}
