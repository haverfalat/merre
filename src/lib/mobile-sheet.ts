export const DEFAULT_SHEET_FRACTION = 0.48;
export const MIN_SHEET_HEIGHT = 156;
export function mobileSheetSnaps(shortScreen: boolean) {
  return [shortScreen ? 0.22 : 0.18, DEFAULT_SHEET_FRACTION, shortScreen ? 0.72 : 0.85];
}
export function mobileSheetFraction(value: number, shortScreen: boolean) {
  return mobileSheetSnaps(shortScreen).reduce((nearest, point) =>
    Math.abs(point - value) < Math.abs(nearest - value) ? point : nearest,
  );
}
export function mobileSheetHeight(viewportHeight: number, value: number, shortScreen: boolean) {
  return Math.min(
    viewportHeight,
    Math.max(MIN_SHEET_HEIGHT, viewportHeight * mobileSheetFraction(value, shortScreen)),
  );
}
