import { auth } from '@/authConfig';
import { NextResponse } from 'next/server';

export default auth((req) => {
  // ถ้าไม่มี session ให้ redirect ไปหน้า login
  if (!req.auth) {
    const url = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/report/:path*'],
};
