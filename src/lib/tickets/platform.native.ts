import * as Crypto from 'expo-crypto';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import type { CryptoAdapter, MobilePresentationFonts } from 'budapestgo-api/mobile';
import { readSecure, writeSecure } from './secure-storage.native';

export const ticketCrypto: CryptoAdapter = {
  randomBytes: (length) => Crypto.getRandomBytes(length),
  digestSha256: async (bytes) =>
    new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(bytes))),
};
let fontsRequest: Promise<MobilePresentationFonts> | null = null;
export function loadTicketFonts(): Promise<MobilePresentationFonts> {
  fontsRequest ??= Promise.all(
    [
      require('../../../assets/budapestgo/barlow_regular.ttf'),
      require('../../../assets/budapestgo/barlow_bold.ttf'),
    ].map(async (module) => {
      const asset = await Asset.fromModule(module).downloadAsync();
      if (!asset.localUri) throw new Error('Font unavailable');
      return `data:font/ttf;base64,${await new File(asset.localUri).base64()}`;
    }),
  )
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((error) => {
      fontsRequest = null;
      throw error;
    });
  return fontsRequest;
}
export function accountTicketStore(accountId: string, legacyKeys: readonly string[] = []) {
  return {
    read: async <T>(key: string) =>
      (await readSecure<T>(`provider.${accountId}.${key}`)) ??
      (legacyKeys.includes(key) ? readSecure<T>(key) : null),
    write: <T>(key: string, value: T) => writeSecure(`provider.${accountId}.${key}`, value),
  };
}
