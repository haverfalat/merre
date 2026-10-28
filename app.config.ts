import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!config.name || !config.slug) throw new Error('App name and slug are required');
  const noOTA = process.env.MERRE_NO_OTA === '1';
  const channel = process.env.MERRE_OTA_CHANNEL || 'production';
  const projectId = config.extra?.eas?.projectId;
  if (!noOTA && !projectId) throw new Error('EAS project ID is required for OTA builds');
  const build = process.env.MERRE_BUILD_NUMBER;
  const version = process.env.MERRE_RELEASE_VERSION;
  if (build && (!/^\d+$/.test(build) || Number(build) <= 0 || Number(build) > 2_100_000_000))
    throw new Error('Invalid mobile build number');
  return {
    ...config,
    // noOTA omits both the plugin and the native dependency (see the build matrix).
    plugins: [...(config.plugins ?? []).filter((plugin) =>
      (typeof plugin === 'string' ? plugin : plugin[0]) !== 'expo-updates'),
      ...(!noOTA ? ['expo-updates'] : [])],
    updates: noOTA ? { enabled: false } : {
      enabled: true,
      url: `https://u.expo.dev/${projectId}`,
      requestHeaders: { 'expo-channel-name': channel },
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: noOTA ? undefined : { policy: 'fingerprint' },
    extra: { ...config.extra, buildVariant: noOTA ? 'noOTA' : 'standard' },
    name: config.name,
    slug: config.slug,
    ...(version ? { version } : {}),
    ios: { ...config.ios, ...(build ? { buildNumber: build } : {}) },
    android: { ...config.android, ...(build ? { versionCode: Number(build) } : {}) },
  };
};
