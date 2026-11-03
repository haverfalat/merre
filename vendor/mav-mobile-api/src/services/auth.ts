import { MavMobileError } from '../errors.js';
import type { Transport } from '../http.js';
import { parseWebSession, type SessionStore } from '../session.js';
import { epochMillis, isRecord, requiredString, requireField, requireAnyField } from '../validation.js';
import { tokenXml, tokenExpiresAt } from '../tokens.js';
import type {
  AccountProfile,
  ApiMessage,
  LoginResponse,
  RequestOptions,
  UserResponse,
} from '../types.js';

export class AuthService {
  private busy = false;
  private renewal: Promise<void> | null = null;
  private nextRenewalAt = 0;

  constructor(
    private readonly http: Transport,
    private readonly sessions: SessionStore,
  ) {}

  private renewalTime(expiresAt: number | null, delay: number): number {
    const now = Date.now();
    return now + Math.min(delay, expiresAt == null ? Infinity : Math.max(0, (expiresAt - now) / 2));
  }

  async login(email: string, password: string, options?: RequestOptions): Promise<AccountProfile> {
    requiredString(email, 'email');
    requiredString(password, 'password');
    if (!/^[^\s@]+@[^\s@]+$/.test(email.trim()))
      throw new MavMobileError('input', 'Invalid email address');
    if (this.busy) throw new MavMobileError('busy', 'MAV sign-in is already in progress');
    this.busy = true;
    try {
      const response = await this.http.request<LoginResponse>(
        'Bejelentkezes',
        {
          FelhasznaloAzonosito: email.trim(),
          Jelszo: password,
        },
        options,
      );
      const expiresAt = epochMillis(response.ErvenyessegVege);
      if (
        typeof response.Token !== 'string' ||
        !response.Token ||
        expiresAt == null ||
        expiresAt <= Date.now()
      )
        throw new MavMobileError(
          'auth',
          'MAV sign-in did not return a valid session',
          'Bejelentkezes',
          undefined,
          Array.isArray(response.Uzenetek)
            ? (response.Uzenetek.filter(isRecord) as ApiMessage[])
            : [],
        );
      const profile: AccountProfile = {
        version: 1,
        provider: 'mav-mobile',
        email: email.trim(),
        uaid: this.sessions.profile?.uaid ?? this.sessions.uaid,
        session: { token: tokenXml(response.Token), expiresAt },
      };
      await this.sessions.set(profile);
      this.nextRenewalAt = 0;
      return this.sessions.require();
    } finally {
      this.busy = false;
    }
  }

  /** Renew while the session is still valid; expired sessions need sign-in. */
  async ensureSession(options?: RequestOptions): Promise<void> {
    if (options?.signal?.aborted) throw new MavMobileError('aborted', 'MAV request cancelled');
    if (this.renewal) return this.renewal;
    const profile = this.sessions.require();
    const expiry = profile.session.expiresAt ?? tokenExpiresAt(profile.session.token);
    if (expiry == null || expiry - Date.now() > 24 * 60 * 60_000) return;
    if (Date.now() < this.nextRenewalAt) return;
    // A shared renewal must not be cancelled by just one of its callers.
    this.renewal = this.refresh({ language: options?.language }).then((renewed) => {
      this.nextRenewalAt = this.renewalTime(renewed.session.expiresAt, 60 * 60_000);
    }).catch((error: unknown) => {
      if (!(error instanceof MavMobileError) ||
          !['network', 'timeout', 'http', 'temporarily-unavailable', 'api', 'protocol', 'busy'].includes(error.code))
        throw error;
      // A failed renewal must not hide tickets while the old token is still valid.
      this.nextRenewalAt = this.renewalTime(this.sessions.require().session.expiresAt, 60_000);
    }).finally(() => { this.renewal = null; });
    return this.renewal;
  }

  async logout(): Promise<void> {
    if (this.busy) throw new MavMobileError('busy', 'MAV sign-in is in progress');
    await this.sessions.set(null);
    this.nextRenewalAt = 0;
  }

  async refresh(options?: RequestOptions): Promise<AccountProfile> {
    if (this.busy) throw new MavMobileError('busy', 'MAV sign-in is in progress');
    const profile = this.sessions.require();
    this.busy = true;
    try {
      const response = await this.http.request<LoginResponse>(
        'BejelentkezesHosszabbitas',
        {},
        options,
        true,
      );
      // Preserve provider cooldown/network errors instead of asking for sign-in.
      requireAnyField(response, ['Token'], 'BejelentkezesHosszabbitas');
      const expiresAt = epochMillis(response.ErvenyessegVege);
      if (
        typeof response.Token !== 'string' ||
        !response.Token ||
        expiresAt == null ||
        expiresAt <= Date.now()
      )
        throw new MavMobileError(
          'auth',
          'MAV did not renew the session',
          'BejelentkezesHosszabbitas',
          undefined,
          Array.isArray(response.Uzenetek)
            ? (response.Uzenetek.filter(isRecord) as ApiMessage[])
            : [],
        );
      const next = { ...profile, session: { token: tokenXml(response.Token), expiresAt } };
      await this.sessions.set(next);
      return this.sessions.require();
    } finally {
      this.busy = false;
    }
  }

  async importWebSession(input: unknown, options?: RequestOptions): Promise<AccountProfile> {
    const session = parseWebSession(input);
    const token = tokenXml(session.userTokenXml);
    const expiry = tokenExpiresAt(token);
    const knownExpiries = [expiry, session.expiresAt].filter(
      (value): value is number => value != null,
    );
    const expiresAt = knownExpiries.length ? Math.min(...knownExpiries) : null;
    if (expiresAt != null && expiresAt <= Date.now())
      throw new MavMobileError('expired-session', 'The web session has expired');
    if (this.busy) throw new MavMobileError('busy', 'MAV sign-in is already in progress');
    this.busy = true;
    try {
      const response = await this.http.request<UserResponse>(
        'GetFelhasznaloAdat',
        {
          FelhasznaloAzonosito: session.email,
          Token: token,
        },
        options,
      );
      requireField(response, 'FelhasznaloAdat', 'GetFelhasznaloAdat', false);
      const email = response.FelhasznaloAdat.EmailCim;
      if (typeof email !== 'string' || email.toLowerCase() !== session.email.toLowerCase())
        throw new MavMobileError('auth', 'The MAV web session belongs to a different account');
      const profile: AccountProfile = {
        version: 1,
        provider: 'mav-mobile',
        email,
        uaid: this.sessions.profile?.uaid ?? this.sessions.uaid,
        session: { token, expiresAt },
      };
      await this.sessions.set(profile);
      this.nextRenewalAt = 0;
      return this.sessions.require();
    } finally {
      this.busy = false;
    }
  }
}
