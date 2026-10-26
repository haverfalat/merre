import * as SecureStore from 'expo-secure-store';
import { newAccountId } from './identity.native';
import { base64, decodeBase64, decodeUtf8, encodeUtf8 } from './encoding';
import { TicketWalletError } from './errors';

const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const prefix = 'merre.tickets';
let writeQueue: Promise<unknown> = Promise.resolve();
interface Manifest {
  version: string;
  count: number;
}
export async function readSecure<T>(name: string): Promise<T | null> {
  const metadata = await SecureStore.getItemAsync(`${prefix}.${name}.meta`, options);
  if (!metadata) return null;
  const manifest = JSON.parse(metadata) as Manifest;
  if (
    !/^[A-Za-z0-9_-]+$/.test(manifest.version) ||
    !Number.isSafeInteger(manifest.count) ||
    manifest.count < 1 ||
    manifest.count > 512
  )
    throw new TicketWalletError('identity');
  const parts = await Promise.all(
    Array.from({ length: manifest.count }, (_, index) =>
      SecureStore.getItemAsync(`${prefix}.${name}.${manifest.version}.${index}`, options),
    ),
  );
  if (parts.some((part) => part === null)) throw new TicketWalletError('identity');
  return JSON.parse(decodeUtf8(decodeBase64(parts.join('')))) as T;
}
export function writeSecure<T>(name: string, value: T): Promise<void> {
  const operation = writeQueue
    .catch(() => {})
    .then(async () => {
      const metadataKey = `${prefix}.${name}.meta`;
      const old = await SecureStore.getItemAsync(metadataKey, options);
      const oldManifest = old ? (JSON.parse(old) as Manifest) : null;
      const encoded = base64(encodeUtf8(JSON.stringify(value)));
      const version = newAccountId().replaceAll('-', ''),
        count = Math.ceil(encoded.length / 1500);
      if (count < 1 || count > 512) throw new TicketWalletError('import');
      await Promise.all(
        Array.from({ length: count }, (_, index) =>
          SecureStore.setItemAsync(
            `${prefix}.${name}.${version}.${index}`,
            encoded.slice(index * 1500, (index + 1) * 1500),
            options,
          ),
        ),
      );
      await SecureStore.setItemAsync(metadataKey, JSON.stringify({ version, count }), options);
      if (oldManifest)
        await Promise.all(
          Array.from({ length: oldManifest.count }, (_, index) =>
            SecureStore.deleteItemAsync(
              `${prefix}.${name}.${oldManifest.version}.${index}`,
              options,
            ).catch(() => {}),
          ),
        );
    });
  writeQueue = operation;
  return operation;
}
