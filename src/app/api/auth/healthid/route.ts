import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/authConfig'
import { redirect } from 'next/navigation';
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
    }
    console.log("Authorization Health id Code :", code);

    const response = await fetch('https://moph.id.th/api/v1/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.HEALTH_REDIRECT_URI!,
            client_id: process.env.HEALTH_CLIENT_ID,
            client_secret: process.env.HEALTH_CLIENT_SECRET
        })
    });
    const data = await response.json();
    if (!response.ok) {
        return NextResponse.json({ error: data.error || 'Failed to fetch Health ID token' }, { status: response.status });
    }
    console.log("Health ID Data:", data);


    const userResponse = await fetch('https://provider.id.th/api/v1/services/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.PROVIDER_CLIENT_ID,
            secret_key: process.env.PROVIDER_CLIENT_SECRET, // Changed from PROVIDER_SECRET_KEY
            token_by: 'Health ID',
            token: data.data.access_token
        })
    });
    const userData = await userResponse.json();
    console.log("Provider Data:", userData);
    if (!userResponse.ok) {
        return NextResponse.json({ error: userData.error || 'Failed to fetch provider data' }, { status: userResponse.status });
    }

    const profileResponse = await fetch('https://provider.id.th/api/v1/services/profile?position_type=1', {
        method: 'GET',
        headers: {
            'client-id': process.env.PROVIDER_CLIENT_ID!,
            'secret-key': process.env.PROVIDER_CLIENT_SECRET!,
            'Authorization': `Bearer ${userData.data.access_token}`
        }

    });
    const profileData = await profileResponse.json();
    console.log("Profile Data ", profileData, typeof profileData);
    if (!profileResponse.ok) {
        return NextResponse.json({ error: profileData.error || 'Failed to fetch profile data' }, { status: profileResponse.status });
    }

    //return NextResponse.json(profileData.data);
    const res = await signIn('credentials', {
        'cred-way': 'health-id',
        'profile': JSON.stringify(profileData.data),
        redirectTo: "/report"
    });
    console.log("res sign in = ", res);

    //redirect('/profile');
}
