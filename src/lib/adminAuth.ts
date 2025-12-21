import { cache } from 'react';
import { auth } from '@/authConfig';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

type AccountUserAuth = {
  role: string | null;
  active: boolean;
  full_name_th: string | null;
  full_name_en: string | null;
  email: string | null;
};

type AdminAuthContext = {
  session: Session | null;
  providerId: string;
  displayNameFromProfile: string;
  user: AccountUserAuth | null;
};

export const getAdminAuthContext = cache(async (): Promise<AdminAuthContext> => {
  const session = await auth();

  const baseName = session?.user?.name || '';
  const profile = session?.user ? (session.user as any).profile : undefined;

  let providerId = baseName;
  let displayNameFromProfile = baseName;

  if (profile) {
    try {
      const parsedProfile = typeof profile === 'string' ? JSON.parse(profile) : profile;
      providerId = parsedProfile.provider_id || parsedProfile.sub || parsedProfile.id || baseName;

      const thFullName = [parsedProfile.title_th, parsedProfile.name_th].filter(Boolean).join(' ').trim();
      const enFullName = [parsedProfile.title_en, parsedProfile.name_eng].filter(Boolean).join(' ').trim();

      displayNameFromProfile =
        thFullName ||
        enFullName ||
        parsedProfile.full_name_th ||
        parsedProfile.full_name ||
        parsedProfile.name ||
        parsedProfile.display_name ||
        baseName;
    } catch {
      // ignore parse errors
    }
  }

  const user = providerId
    ? await prisma.accountUser.findUnique({
        where: { provider_id: providerId },
        select: { role: true, active: true, full_name_th: true, full_name_en: true, email: true },
      })
    : null;

  return { session, providerId, displayNameFromProfile, user };
});

export async function requireAdminRole() {
  const ctx = await getAdminAuthContext();

  if (!ctx.session?.user) {
    throw new Error('Unauthorized');
  }

  if (!ctx.user || !ctx.user.active || ctx.user.role !== 'admin') {
    throw new Error('Access denied. Admin role required.');
  }

  return ctx;
}
