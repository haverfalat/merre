import { DEFAULT_UAID } from './constants.js';
import { MavMobileError } from './errors.js';
import { isRecord, requiredString } from './validation.js';
import type { AccountProfile, WebSession } from './types.js';

export function parseAccountProfile(input: unknown): AccountProfile {
  let value = input;
  if (typeof value === 'string') {
    if (value.length > 1_000_000) throw new MavMobileError('input', 'Account export is too large');
    try {
      value = JSON.parse(value);
    } catch {
      throw new MavMobileError('input', 'Invalid account JSON');
    }
  }
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    value.provider !== 'mav-mobile' ||
    !isRecord(value.session) ||
    (value.session.expiresAt !== null &&
      (typeof value.session.expiresAt !== 'number' ||
        !Number.isFinite(value.session.expiresAt) ||
        value.session.expiresAt <= 0 ||
        Math.abs(value.session.expiresAt) > 8.64e15))
  )
    throw new MavMobileError('input', 'Invalid MAV account profile');
  const email = requiredString(value.email, 'email').trim();
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) throw new MavMobileError('input', 'Invalid email address');
  return {
    version: 1,
    provider: 'mav-mobile',
    email,
    uaid: requiredString(value.uaid, 'uaid'),
    session: {
      token: requiredString(value.session.token, 'token'),
      expiresAt: value.session.expiresAt,
    },
  };
}

export function parseWebSession(input: unknown): WebSession {
  let value = input;
  if (typeof value === 'string') {
    if (value.length > 1_000_000) throw new MavMobileError('input', 'Web session is too large');
    try {
      value = JSON.parse(value);
    } catch {
      throw new MavMobileError('input', 'Invalid web session JSON');
    }
  }
  if (!isRecord(value) || value.provider !== 'mav-web')
    throw new MavMobileError('input', 'Invalid MAV web session');
  const email = requiredString(value.email, 'email').trim();
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) throw new MavMobileError('input', 'Invalid email address');
  const expiresAt = value.expiresAt ?? null;
  if (
    expiresAt !== null &&
    (typeof expiresAt !== 'number' ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= 0 ||
      expiresAt > 8.64e15)
  )
    throw new MavMobileError('input', 'Invalid session expiry');
  return {
    provider: 'mav-web',
    email,
    userTokenXml: requiredString(value.userTokenXml, 'userTokenXml'),
    expiresAt,
  };
}

export function exportAccountProfile(profile: AccountProfile): string {
  return JSON.stringify(parseAccountProfile(profile), null, 2);
}

export class SessionStore {
  private current: AccountProfile | null;

  constructor(
    profile: unknown,
    readonly uaid: string = DEFAULT_UAID,
    private readonly persist?: (profile: AccountProfile | null) => Promise<void> | void,
  ) {
    this.current = profile == null ? null : parseAccountProfile(profile);
    requiredString(uaid, 'uaid');
  }

  get profile(): AccountProfile | null {
    return this.current ? parseAccountProfile(this.current) : null;
  }

  require(): AccountProfile {
    const profile = this.profile;
    if (!profile) throw new MavMobileError('auth', 'Sign in to MAV first');
    if (profile.session.expiresAt !== null && profile.session.expiresAt <= Date.now())
      throw new MavMobileError('expired-session', 'The MAV session has expired; sign in again');
    return profile;
  }

  async set(profile: AccountProfile | null): Promise<void> {
    const value = profile ? parseAccountProfile(profile) : null;
    await this.persist?.(value ? parseAccountProfile(value) : null);
    this.current = value;
  }
}
