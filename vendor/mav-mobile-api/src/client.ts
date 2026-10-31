import { DEFAULT_UAID } from './constants.js';
import { Transport, type TransportOptions } from './http.js';
import { SessionStore } from './session.js';
import { AuthService } from './services/auth.js';
import { AccountService } from './services/account.js';
import { OrdersService } from './services/orders.js';
import { PassHoldersService } from './services/pass-holders.js';
import { TicketImagesService } from './services/ticket-images.js';
import { TravelService } from './services/travel.js';
import { PurchasesService } from './services/purchases.js';
import { TicketDetailsService } from './services/ticket-details.js';
import type { AccountProfile } from './types.js';

export interface ClientOptions extends TransportOptions {
  profile?: unknown;
  uaid?: string;
  persist?: (profile: AccountProfile | null) => Promise<void> | void;
}

export class MavMobileClient {
  private readonly sessions: SessionStore;
  readonly auth: AuthService;
  readonly account: AccountService;
  readonly orders: OrdersService;
  readonly passHolders: PassHoldersService;
  readonly ticketImages: TicketImagesService;
  readonly travel: TravelService;
  readonly purchases: PurchasesService;
  readonly ticketDetails: TicketDetailsService;

  constructor(options: ClientOptions = {}) {
    this.sessions = new SessionStore(
      options.profile,
      options.uaid ?? DEFAULT_UAID,
      options.persist,
    );
    const http = new Transport(this.sessions, options);
    this.auth = new AuthService(http, this.sessions);
    http.beforeAuthenticatedRequest = (options) => this.auth.ensureSession(options);
    this.account = new AccountService(http);
    this.orders = new OrdersService(http);
    this.passHolders = new PassHoldersService(http);
    this.ticketImages = new TicketImagesService(http);
    this.travel = new TravelService(http);
    this.purchases = new PurchasesService(http);
    this.ticketDetails = new TicketDetailsService(http);
  }

  get profile(): AccountProfile | null {
    return this.sessions.profile;
  }
}
