import { clearOfflineMav } from './mav-offline.native';
import { create } from 'zustand';
import { newAccountId } from './identity.native';
import { readSecure, writeSecure } from './secure-storage.native';
import { PartialAccountImportError, TicketWalletError } from './errors';
import { providerById } from './providers.native';
import type { AccountSummary, AccountVault, TicketAccount, TicketBackend } from './types';

interface State {
  ready: boolean;
  error: boolean;
  accounts: AccountSummary[];
  activeAccountId: string | null;
}
export const useTicketAccounts = create<State>(() => ({
  ready: false,
  error: false,
  accounts: [],
  activeAccountId: null,
}));
let vault: AccountVault = { version: 1, activeAccountId: null, accounts: [] };
let initialization: Promise<void> | null = null;
let queue: Promise<unknown> = Promise.resolve();
const clients = new Map<string, { revision: string; backend: TicketBackend }>();
const summaries = () => vault.accounts.map(({ payload: _payload, ...account }) => account);
function publish() {
  useTicketAccounts.setState({
    ready: true,
    error: false,
    accounts: summaries(),
    activeAccountId: vault.activeAccountId,
  });
}
export function initializeAccounts(): Promise<void> {
  initialization ??= readSecure<AccountVault>('accounts')
    .then((saved) => {
      if (saved) {
        if (
          saved.version !== 1 ||
          !Array.isArray(saved.accounts) ||
          saved.accounts.some((a) => !a.id || !a.providerId || !a.revision)
        )
          throw new TicketWalletError('identity');
        vault = saved;
      }
      publish();
    })
    .catch((error) => {
      initialization = null;
      useTicketAccounts.setState({ ready: false, error: true });
      throw error;
    });
  return initialization;
}
function change(update: (current: AccountVault) => AccountVault): Promise<void> {
  const operation = queue
    .catch(() => {})
    .then(async () => {
      await initializeAccounts();
      const next = update(vault);
      await writeSecure('accounts', next);
      vault = next;
      publish();
    });
  queue = operation;
  return operation;
}
export function selectAccount(id: string): Promise<void> {
  return change((current) => {
    if (!current.accounts.some((a) => a.id === id)) throw new TicketWalletError('identity');
    return { ...current, activeAccountId: id };
  });
}
export function removeAccount(id: string): Promise<void> {
  return clearOfflineMav(id).then(() => change((current) => {
    clients.delete(id);
    const accounts = current.accounts.filter((a) => a.id !== id);
    return {
      ...current,
      accounts,
      activeAccountId:
        current.activeAccountId === id ? (accounts[0]?.id ?? null) : current.activeAccountId,
    };
  }));
}
export function renameAccount(id: string, label: string): Promise<void> {
  if (!label.trim() || label.length > 100) return Promise.reject(new TicketWalletError('import'));
  return change((current) => ({
    ...current,
    accounts: current.accounts.map((a) => (a.id === id ? { ...a, label: label.trim() } : a)),
  }));
}
export function addAccounts(
  items: { providerId: string; label: string; payload: unknown }[],
): Promise<void> {
  return change((current) => {
    const accounts = [...current.accounts];
    let activeAccountId = current.activeAccountId;
    for (const item of items) {
      const provider = providerById(item.providerId);
      const existing = accounts.find(
        (a) =>
          a.providerId === item.providerId &&
          provider.identity(a.payload) === provider.identity(item.payload),
      );
      const account: TicketAccount = {
        ...item,
        id: existing?.id ?? newAccountId(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        revision: newAccountId(),
      };
      if (existing) {
        accounts.splice(accounts.indexOf(existing), 1, account);
        clients.delete(existing.id);
      } else accounts.push(account);
      activeAccountId = account.id;
    }
    if (accounts.length > 32) throw new TicketWalletError('import');
    return { ...current, accounts, activeAccountId };
  });
}
export function backendFor(id: string): TicketBackend {
  const account = vault.accounts.find((a) => a.id === id);
  if (!account) throw new TicketWalletError('auth');
  const cached = clients.get(id);
  if (cached?.revision === account.revision) return cached.backend;
  const backend = providerById(account.providerId).connect(account, (payload) =>
    change((current) => {
      const present = current.accounts.find((a) => a.id === id);
      if (!present || present.revision !== account.revision)
        throw new TicketWalletError('expired-session');
      return {
        ...current,
        accounts: current.accounts.map((a) => (a.id === id ? { ...a, payload } : a)),
      };
    }),
  );
  clients.set(id, { revision: account.revision, backend });
  return backend;
}
export async function importAccounts(text: string, applicationId?: string): Promise<number> {
  if (text.length > 750_000) throw new TicketWalletError('import');
  let input: Record<string, unknown>;
  try {
    input = asObject(JSON.parse(text));
  } catch {
    throw new TicketWalletError('import');
  }
  let records: unknown[];
  if (
    input.format === 'merre-ticket-accounts' &&
    input.version === 1 &&
    Array.isArray(input.accounts)
  )
    records = input.accounts;
  else
    records = [
      {
        providerId:
          input.provider === 'mav-mobile' || input.provider === 'mav-web' ? 'mav' : 'budapestgo',
        payload:
          applicationId && input.provider !== 'mav-mobile' && input.provider !== 'mav-web'
            ? { ...input, applicationId }
            : input,
      },
    ];
  if (!records.length || records.length > 32) throw new TicketWalletError('import');
  const prepared = records.map((record) => {
    const item = asObject(record);
    if (typeof item.providerId !== 'string') throw new TicketWalletError('import');
    providerById(item.providerId);
    return {
      providerId: item.providerId,
      payload: item.payload,
      label: typeof item.label === 'string' ? item.label.trim().slice(0, 100) : '',
    };
  });
  let imported = 0;
  for (const item of prepared) {
    try {
      const result = await providerById(item.providerId).importAccount(item.payload);
      await addAccounts([
        { providerId: item.providerId, label: item.label || result.label, payload: result.payload },
      ]);
      imported += 1;
    } catch (error) {
      if (imported)
        throw new PartialAccountImportError(
          imported,
          JSON.stringify(
            { format: 'merre-ticket-accounts', version: 1, accounts: prepared.slice(imported) },
            null,
            2,
          ),
        );
      throw error;
    }
  }
  return imported;
}
export async function exportAccounts(id?: string): Promise<string> {
  await initializeAccounts();
  await queue;
  const accounts = vault.accounts.filter((a) => !id || a.id === id);
  if (!accounts.length) throw new TicketWalletError('auth');
  return JSON.stringify(
    {
      format: 'merre-ticket-accounts',
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: accounts.map(({ providerId, label, payload }) => ({ providerId, label, payload })),
    },
    null,
    2,
  );
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TicketWalletError('import');
  return value as Record<string, unknown>;
}

export function accountRecord(id: string): Readonly<TicketAccount> {
  const account = vault.accounts.find((account) => account.id === id);
  if (!account) throw new TicketWalletError('identity');
  return account;
}
