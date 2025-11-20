'use server'


import { redirect } from 'next/navigation';


export const signInWithHealthId = async () => {
    const clientId = process.env.HEALTH_CLIENT_ID;
    const redirectUri = 'http://localhost:3000/api/auth/healthid';
    const url = `https://moph.id.th/oauth/redirect?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    redirect(url);
}


