import {
  asObject,
  BudapestGoError,
  requireString,
  type WalletProfile,
  type Account,
} from 'budapestgo-api/mobile';

export type BudapestGoProfile = WalletProfile & { owner?: Account };

export function parseBudapestGoProfile(value: unknown): BudapestGoProfile {
  try {
    const object = asObject(value);
    const rawSession = asObject(object.session ?? object);
    const rawInstallation = object.installation ? asObject(object.installation) : rawSession;
    const applicationId = requireString(rawInstallation.applicationId);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId))
      throw new Error();
    if (rawSession.applicationId && rawSession.applicationId !== applicationId) throw new Error();
    if (
      typeof rawSession.expiresAt !== 'number' ||
      !Number.isFinite(rawSession.expiresAt) ||
      rawSession.expiresAt <= 0
    )
      throw new Error();
    const accessToken = requireString(rawSession.accessToken);
    const refreshToken =
      rawSession.refreshToken === null || rawSession.refreshToken === undefined
        ? null
        : requireString(rawSession.refreshToken);
    if (accessToken.length > 30_000 || (refreshToken?.length ?? 0) > 30_000) throw new Error();
    return {
      version: 1,
      ...(object.owner && typeof asObject(object.owner).sub === 'string'
        ? { owner: asObject(object.owner) as unknown as Account }
        : {}),
      installation: {
        applicationId,
        createdAt:
          typeof rawInstallation.createdAt === 'string'
            ? rawInstallation.createdAt
            : new Date().toISOString(),
      },
      session: { applicationId, accessToken, refreshToken, expiresAt: rawSession.expiresAt },
    };
  } catch {
    throw new BudapestGoError('import');
  }
}
