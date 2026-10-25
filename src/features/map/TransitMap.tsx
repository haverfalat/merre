// Metro resolves .native.tsx or .web.tsx. This declaration keeps TypeScript's
// platform-neutral module graph explicit without importing native code on web.
export { TransitMap } from './TransitMap.native';
