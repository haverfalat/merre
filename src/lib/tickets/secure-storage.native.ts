import * as SecureStore from 'expo-secure-store';
import { newAccountId } from './identity.native';
import { base64, decodeBase64, decodeUtf8, encodeUtf8 } from './encoding';
import { TicketWalletError } from './errors';

const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const prefix = 'merre.tickets';
let storageQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const pending = storageQueue.catch(() => {}).then(operation);
  storageQueue = pending;
  return pending;
}
interface Manifest {
  version: string;
  count: number;
}
function parseManifest(metadata: string): Manifest {
  const manifest = JSON.parse(metadata) as Manifest | null;
  if (
    !manifest ||
    typeof manifest.version !== 'string' ||
    !/^[A-Za-z0-9_-]+$/.test(manifest.version) ||
    !Number.isSafeInteger(manifest.count) ||
    manifest.count < 1 ||
    manifest.count > 512
  )
    throw new TicketWalletError('identity');
  return manifest;
}
function chunkKey(name: string, manifest: Manifest, index: number) {
  return `${prefix}.${name}.${manifest.version}.${index}`;
}
async function deleteChunks(name: string, manifest: Manifest) {
  await Promise.all(
    Array.from({ length: manifest.count }, (_, index) =>
      SecureStore.deleteItemAsync(chunkKey(name, manifest, index), options).catch(() => {}),
    ),
  );
}
export function readSecure<T>(name: string): Promise<T | null> {
  // A writer must not delete old chunks while a reader is still using their manifest.
  return serialize(() => readValue<T>(name));
}

async function readValue<T>(name: string): Promise<T | null> {
  const metadata = await SecureStore.getItemAsync(`${prefix}.${name}.meta`, options);
  if (!metadata) return null;
  const manifest = parseManifest(metadata);
  const parts = await Promise.all(
    Array.from({ length: manifest.count }, (_, index) =>
      SecureStore.getItemAsync(chunkKey(name, manifest, index), options),
    ),
  );
  if (parts.some((part) => part === null)) throw new TicketWalletError('identity');
  return JSON.parse(decodeUtf8(decodeBase64(parts.join('')))) as T;
}
export function writeSecure<T>(name: string, value: T): Promise<void> {
  return serialize(async () => {
    const metadataKey = `${prefix}.${name}.meta`;
    const old = await SecureStore.getItemAsync(metadataKey, options);
    const oldManifest = old ? parseManifest(old) : null;
    const encoded = base64(encodeUtf8(JSON.stringify(value)));
    const version = newAccountId().replaceAll('-', ''),
      count = Math.ceil(encoded.length / 1500);
    if (count < 1 || count > 512) throw new TicketWalletError('import');
    const manifest = { version, count };
    try {
      // Wait for every chunk before cleanup, including writes after the first failure.
      const writes = await Promise.allSettled(
        Array.from({ length: count }, (_, index) =>
          SecureStore.setItemAsync(
            chunkKey(name, manifest, index),
            encoded.slice(index * 1500, (index + 1) * 1500),
            options,
          ),
        ),
      );
      const failed = writes.find((write) => write.status === 'rejected');
      if (failed) throw failed.reason;
      await SecureStore.setItemAsync(metadataKey, JSON.stringify(manifest), options);
    } catch (error) {
      await deleteChunks(name, manifest);
      throw error;
    }
    if (oldManifest) await deleteChunks(name, oldManifest);
  });
}
