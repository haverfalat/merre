import { epochMillis } from 'mav-mobile-api';
import { readSecure, writeSecure } from './secure-storage.native';
import type { TicketPresentation, WalletTicket } from './types';

const key = (account: string, id: string) => `mavoffline.${account}.${Array.from(id).map(c => c.codePointAt(0)!.toString(16).padStart(6, '0')).join('')}`;
const catalogKey = (account: string) => `mavoffline.${account}.catalog`;
const presentations = new Map<string, TicketPresentation>();
const removed = new Set<string>();
const downloaded = new Map<string, Set<string>>();
export function activeOfflineTicket(ticket: WalletTicket, now = Date.now()) {
  const end = epochMillis(ticket.validTo);
  const start = epochMillis(ticket.validFrom);
  return ticket.canInspect && end != null && end > now &&
    ['VALID', 'FUTURE_VALID'].includes(ticket.status) &&
    (ticket.status !== 'FUTURE_VALID' || start != null) && (start == null || start <= now);
}
export async function offlineMavTickets(account: string): Promise<WalletTicket[]> {
  const list = await readSecure<WalletTicket[]>(catalogKey(account)) ?? [];
  return list.filter(t => activeOfflineTicket(t)).map(t => ({ ...t, status: 'VALID' }));
}
export async function offlineMavPresentation(account: string, id: string) {
  if (removed.has(account)) return null;
  const ticket = (await offlineMavTickets(account)).find(t => t.id === id);
  if (!ticket?.offlineAvailable) return null;
  return savedMavPresentation(account, id);
}
export async function savedMavPresentation(account: string, id: string) {
  if (removed.has(account)) return null;
  const saved = presentations.get(key(account, id)) ?? await readSecure<TicketPresentation>(key(account, id));
  if (!saved || saved.expiresAt <= Date.now()) return null;
  presentations.set(key(account, id), saved);
  return saved;
}
export async function saveMavPresentation(account: string, id: string, presentation: TicketPresentation) {
  if (removed.has(account)) return;
  const ids = downloaded.get(account) ?? new Set<string>();
  ids.add(id); downloaded.set(account, ids);
  await writeSecure(key(account, id), presentation);
  if (!removed.has(account)) presentations.set(key(account, id), presentation);
}
export async function saveMavCatalog(account: string, tickets: WalletTicket[]) {
  if (removed.has(account)) return;
  const old = await readSecure<WalletTicket[]>(catalogKey(account)) ?? [];
  if (removed.has(account)) return;
  await writeSecure(catalogKey(account), tickets);
  for (const t of old) if (!tickets.some(n => n.id === t.id && n.offlineAvailable))
    { presentations.delete(key(account, t.id)); await writeSecure(key(account, t.id), null); }
}
export async function clearOfflineMav(account: string) {
  removed.add(account);
  const list = await readSecure<WalletTicket[]>(catalogKey(account)) ?? [];
  await writeSecure(catalogKey(account), []);
  const ids = new Set([...list.map(t => t.id), ...(downloaded.get(account) ?? [])]);
  for (const id of ids) { presentations.delete(key(account, id)); await writeSecure(key(account, id), null); }
  downloaded.delete(account);
}
