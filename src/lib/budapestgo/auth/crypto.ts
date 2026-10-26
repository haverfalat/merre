import * as Crypto from 'expo-crypto';
import { base64url, type CryptoAdapter } from 'budapestgo-api/mobile';

export const cryptoAdapter: CryptoAdapter = {
  randomBytes: (length) => Crypto.getRandomBytes(length),
  digestSha256: async (bytes) =>
    new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(bytes))),
};
export const newInstallationId = () => Crypto.randomUUID();
export const randomValue = (length = 32) => base64url(Crypto.getRandomBytes(length));
