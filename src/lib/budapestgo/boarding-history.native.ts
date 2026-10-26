import { base64url, encodeUtf8, serverWallTime } from 'budapestgo-api/mobile';
import { readSecure, writeSecure } from '../tickets/secure-storage.native';
import { cryptoAdapter } from './auth/crypto';

let queue: Promise<unknown> = Promise.resolve();
export function recordBoarding(
  accountId: string,
  ticketId: string,
  code: string,
  timestamp: string,
): Promise<boolean> {
  const operation = queue
    .catch(() => {})
    .then(async () => {
      const serverTime = serverWallTime(timestamp);
      const key = base64url(
        await cryptoAdapter.digestSha256(encodeUtf8(JSON.stringify([accountId, ticketId, code]))),
      );
      const history = (await readSecure<Record<string, number>>('boarding-history')) ?? {};
      const previous = history[key];
      const shownTicket =
        typeof previous === 'number' && previous <= serverTime && previous + 180_000 > serverTime;
      const recent = Object.entries(history)
        .filter(
          ([, time]) =>
            typeof time === 'number' && time <= serverTime && time + 180_000 > serverTime,
        )
        .slice(-255);
      await writeSecure('boarding-history', { ...Object.fromEntries(recent), [key]: serverTime });
      return shownTicket;
    });
  queue = operation;
  return operation;
}
