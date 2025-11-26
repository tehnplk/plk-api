import NextAuth, { type Session, type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { cookies } from "next/headers";
import { prisma } from '@/lib/prisma';


const authOptions: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 25, // 25 hours
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        console.log("credentials = ", credentials);
        if (credentials['cred-way'] == 'user-pass') {
          // ยังไม่เชื่อมต่อฐานข้อมูลจริง: ให้ login แบบ user-pass ไม่สำเร็จไปก่อน
          /*
           NOTE: โค้ด prisma ด้านล่างถูก comment ไว้ เพื่อให้ build ผ่าน
           แต่ยังเก็บเป็นตัวอย่างเผื่อเชื่อมฐานข้อมูลภายหลัง

           const user = await prisma.user.findUnique({
             where: {
               username: credentials?.username as string,
             },
           });
           if (!user) {
             return null; // ทำให้ auth fail และ redirect กลับหน้า sign-in
           }
           return {
             name: user.username,
             profile: JSON.stringify(user),
             ssj_department: (user as any).ssj_department,
           };
          */

          return null; // จะทำให้ authentication fail และ redirect กลับหน้า sign-in
        }
        return {
          name: credentials.username as string || 'health-id',
          profile: credentials.profile!,
          ssj_department: (credentials as any).ssj_department,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    LineProvider({
      clientId: process.env.AUTH_LINE_ID,
      clientSecret: process.env.AUTH_LINE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        console.log('🟢 LOGIN SUCCESSFUL - User authenticated:', user.name);
        
        token.profile = (user as any).profile;
        
        // Update login tracking for activated users only (only on initial login)
        // The 'user' object only exists on initial sign-in, not on token refresh
        try {
          const profile = (user as any).profile;
          let providerId = user.name;
          
          // Extract provider_id from profile if available
          if (profile) {
            try {
              const parsedProfile = typeof profile === 'string' ? JSON.parse(profile) : profile;
              providerId = parsedProfile.provider_id || parsedProfile.sub || parsedProfile.id || user.name;
              console.log('🔍 Debug - providerId extracted:', providerId);
              console.log('🔍 Debug - parsedProfile keys:', Object.keys(parsedProfile));
            } catch (e) {
              console.log('Profile parse error, using username as providerId');
            }
          }
          
          // Update login_count and last_login for activated users
          console.log('🔍 Debug - Attempting to update user with provider_id:', providerId);
          
          const updateResult = await prisma.accountUser.updateMany({
            where: {
              provider_id: providerId,
              active: true
            },
            data: {
              last_login: new Date(),
              login_count: {
                increment: 1
              }
            }
          });
          
          console.log('🔍 Debug - Update result count:', updateResult.count);
          
          if (updateResult.count > 0) {
            console.log('✅ Login tracking updated for user:', providerId);
          } else {
            console.log('⚠️ User not found or not activated:', providerId);
            // Check if user exists but is not active
            const existingUser = await prisma.accountUser.findFirst({
              where: {
                provider_id: providerId
              },
              select: {
                id: true,
                provider_id: true,
                active: true,
                login_count: true,
                last_login: true
              }
            });
            if (existingUser) {
              console.log('🔍 Debug - User exists but active status:', existingUser.active);
            } else {
              console.log('🔍 Debug - No user found with provider_id:', providerId);
            }
          }
        } catch (error) {
          console.error('❌ Error updating login tracking:', error);
        }
        
        // Read department from cookie and store in token
        const cookieStore = await cookies();
        const department = cookieStore.get('selectedDepartment')?.value;
        
        console.log('Debug JWT - department from cookie:', department);
        console.log('Debug JWT - user object:', user);
        
        if (department) {
          (token as any).ssj_department = department;
          console.log('Debug JWT - set ssj_department:', department);
          console.log('✅ LOGIN COMPLETE - Department set:', department, 'for user:', user.name);
          // Clear the cookie after reading it
          cookieStore.delete('selectedDepartment');
        } else {
          (token as any).ssj_department = (user as any).ssj_department;
          console.log('Debug JWT - using fallback ssj_department:', (user as any).ssj_department);
          console.log('✅ LOGIN COMPLETE - Using fallback department:', (user as any).ssj_department, 'for user:', user.name);
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        (session.user as any).profile = (token as any).profile; // Add user profile to the session
        (session.user as any).ssj_department = (token as any).ssj_department;
        console.log('🟢 SESSION CREATED - User session ready:', session.user.name, 'Department:', (session.user as any).ssj_department);
      }
      return session;
    },
  },
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);
