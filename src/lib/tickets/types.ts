import type { Href } from 'expo-router';

export interface TicketAccount {
  id: string;
  providerId: string;
  label: string;
  createdAt: string;
  revision: string;
  payload: unknown;
}
export type AccountSummary = Omit<TicketAccount, 'payload'>;
export interface AccountVault {
  version: 1;
  accounts: TicketAccount[];
}
export interface WalletTicket {
  offlineAvailable?: boolean;
  id: string;
  kind?: 'ticket' | 'pass' | 'unknown';
  services?: {
    number: string;
    routeName: string | null;
    departureAt: string;
    arrivalAt: string;
    originId: string;
    destinationId: string;
  }[];
  name: string;
  status: string;
  groupId?: string | null;
  groupItem?: number | null;
  groupSize?: number | null;
  validFrom: string | null;
  validTo: string | null;
  canInspect: boolean;
  canBoard: boolean;
  bound: boolean;
  canTransfer?: boolean;
  remainingTransfers?: number | null;
  transferState?: TicketTransferStatus | null;
}
export interface BoardingChoice {
  id: string;
  title: string;
  subtitle: string;
  routeName?: string;
  headsign?: string;
  mode?: string;
  color?: string;
  kind?: 'vehicle' | 'metro';
  routeId?: string;
  latitude?: number;
  longitude?: number;
  queriedAt?: number;
  target: unknown;
}
export interface TicketPresentation {
  html: string;
  embeddedClose?: boolean;
  expiresAt: number;
  accountId: string;
  title: string;
}
export interface TicketBackend {
  transfer?(ticketId: string, options: { allowMutation: boolean }): Promise<TicketTransferResult>;
  tickets(language: 'hu' | 'en', onUpdate?: (tickets: WalletTicket[]) => void): Promise<WalletTicket[]>;
  scan?(
    ticketId: string,
    code: { format: 'aztec' | 'qr'; value: string },
    language: 'hu' | 'en',
    options?: { allowActivation?: boolean },
  ): Promise<TicketPresentation>;
  inspector?(ticketId: string, language: 'hu' | 'en'): Promise<TicketPresentation>;
  boarding?(ticketId: string, target: unknown, language: 'hu' | 'en', options?: { allowActivation?: boolean }): Promise<TicketPresentation>;
  nearby?(latitude: number, longitude: number): Promise<BoardingChoice[]>;
  stations?(language: 'hu' | 'en'): Promise<BoardingChoice[]>;
}
export interface TicketProvider {
  id: string;
  name: string;
  loginRoute: Href;
  reauthenticateRoute?(accountId: string): Href;
  supportsService?(service: TicketService): boolean;
  matchesService?(ticket: WalletTicket, service: TicketService): boolean;
  capabilities: readonly (
    'inspector' | 'boarding' | 'nearby' | 'stations' | 'scan' | 'transfer' | 'import' | 'export'
  )[];
  connect(account: TicketAccount, persist: (payload: unknown) => Promise<void>): TicketBackend;
  importAccount(payload: unknown): Promise<{ label: string; payload: unknown }>;
  identity(payload: unknown): string;
}

export interface OwnedWalletTicket extends WalletTicket {
  accountId: string;
  accountLabel: string;
  providerId: string;
  providerName: string;
}
export interface TicketReference {
  accountId: string;
  ticketId: string;
}
export interface TicketService {
  routeId?: string;
  routeName?: string;
  agencyId?: string;
  agencyName?: string;
  tripName?: string;
  serviceDay?: string;
  at?: number;
}
export interface BoardingRequest {
  trip?: { id: string; serviceDay?: string; vehicleId?: string | null };
  queriedAt?: number;
  target?: unknown;
  service?: TicketService;
  providerIds?: string[];
  preferredTicket?: TicketReference;
  route?: string;
  scannedCode?: { format: 'aztec' | 'qr'; value: string };
}

export type TicketTransferStatus = 'completed' | 'pending' | 'failed' | 'unknown' | 'retryable';
export interface TicketTransferResult {
  errorLabelId?: string;
  status: TicketTransferStatus;
}
