import { MavMobileError } from '../errors.js';
import type { Transport } from '../http.js';
import { parseWebSession, type SessionStore } from '../session.js';
import { epochMillis, isRecord, requiredString, requireField } from '../validation.js';
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

  constructor(
    private readonly http: Transport,
    private readonly sessions: SessionStore,
  ) {}

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
      return { ...profile, session: { ...profile.session } };
    } finally {
      this.busy = false;
    }
  }

  async logout(): Promise<void> {
    if (this.busy) throw new MavMobileError('busy', 'MAV sign-in is in progress');
    await this.sessions.set(null);
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
      return { ...next, session: { ...next.session } };
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
      return { ...profile, session: { ...profile.session } };
    } finally {
      this.busy = false;
    }
  }
}
