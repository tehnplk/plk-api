import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/authConfig';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userAny = session.user as any;
    const rawProfile = userAny.profile as string | undefined;

    if (!rawProfile) {
      return NextResponse.json(
        { success: false, error: 'No profile data in session' },
        { status: 400 }
      );
    }

    let profile: any;
    try {
      profile = typeof rawProfile === 'string' ? JSON.parse(rawProfile) : rawProfile;
    } catch (e) {
      profile = rawProfile;
    }

    const providerId =
      profile.provider_id ||
      profile.providerId ||
      profile.providerID ||
      profile.provider_code;

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'provider_id is missing in profile' },
        { status: 400 }
      );
    }

    const prefix =
      profile.title_th ||
      profile.prefix_th ||
      profile.prename ||
      profile.prename_th ||
      '';
    const firstName =
      profile.first_name_th ||
      profile.firstname_th ||
      profile.firstName ||
      profile.given_name ||
      '';
    const lastName =
      profile.last_name_th ||
      profile.lastname_th ||
      profile.lastName ||
      profile.family_name ||
      '';
    const nameCore = `${firstName} ${lastName}`.trim();
    const fullNameTh =
      (prefix ? `${prefix} ${nameCore}` : nameCore).trim() ||
      profile.full_name_th ||
      profile.name_th ||
      profile.name ||
      session.user.name ||
      providerId;

    const email = profile.email || (session.user as any).email || null;

    // Store organization as JSON array string
    let organizationJson: string | null = null;
    if (Array.isArray(profile.organization)) {
      // Filter only position, hcode, hname_th from each org
      const orgArray = profile.organization.map((o: any) => ({
        position: o.position || null,
        hcode: o.hcode || null,
        hname_th: o.hname_th || null,
      }));
      organizationJson = JSON.stringify(orgArray);
    } else if (profile.organization) {
      organizationJson = JSON.stringify([{ 
        position: profile.position_name || profile.position || null,
        hcode: profile.hcode || null,
        hname_th: profile.organization || profile.hname_th || null,
      }]);
    }

    const now = new Date();

    const accountId = profile.account_id || profile.accountId || providerId;

    const account = await prisma.accountUser.upsert({
      where: {
        provider_id: providerId,
      },
      update: {
        full_name_th: fullNameTh,
        full_name_en: profile.full_name_en || '',
        email: email || '',
        organization: organizationJson || '',
      },
      create: {
        account_id: accountId,
        provider_id: providerId,
        full_name_th: fullNameTh,
        full_name_en: profile.full_name_en || '',
        email: email || '',
        organization: organizationJson || '',
        role: '',
        created_account_at: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Error upserting account user from profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upsert account user from profile',
        message: String(error),
      },
      { status: 500 }
    );
  }
}
