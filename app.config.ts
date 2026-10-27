import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!config.name || !config.slug) throw new Error('App name and slug are required');
  const build = process.env.MERRE_BUILD_NUMBER;
  const version = process.env.MERRE_RELEASE_VERSION;
  if (build && (!/^\d+$/.test(build) || Number(build) <= 0 || Number(build) > 2_100_000_000))
    throw new Error('Invalid mobile build number');
  return {
    ...config,
    name: config.name,
    slug: config.slug,
    ...(version ? { version } : {}),
    ios: { ...config.ios, ...(build ? { buildNumber: build } : {}) },
    android: { ...config.android, ...(build ? { versionCode: Number(build) } : {}) },
  };
};
