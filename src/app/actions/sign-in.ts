'use server'

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const signInWithHealthId = async (formData: FormData) => {
    const department = formData.get('department') as string;
    
    // Store department in cookie for post-OAuth retrieval
    const cookieStore = await cookies();
    cookieStore.set('selectedDepartment', department, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
    });
    
    const clientId = process.env.HEALTH_CLIENT_ID;
    const redirectUri = process.env.HEALTH_REDIRECT_URI;
    const url = `https://moph.id.th/oauth/redirect?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    redirect(url);
}

