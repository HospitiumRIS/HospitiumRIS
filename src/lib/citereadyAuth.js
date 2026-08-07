import { prisma } from './prisma';

/**
 * Load the current user's stored CiteReady credentials (if any and not expired).
 * Returns { token, environment } or null.
 */
export async function getCiteReadyCredentials(userId) {
  let settings;
  try {
    settings = await prisma.userSettings.findFirst({
      where: { userId, type: 'CITEREADY' },
    });
  } catch (dbError) {
    if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
      return null;
    }
    throw dbError;
  }

  const data = settings?.settings;
  // Password-login mode stores `token`; OAuth mode stores `accessToken`.
  const token = data?.token || data?.accessToken;
  if (!token) return null;

  if (data.tokenExpiresAt && new Date(data.tokenExpiresAt) < new Date()) {
    return null; // expired, caller should prompt reconnect
  }

  return { token, environment: data.environment || 'testing' };
}
