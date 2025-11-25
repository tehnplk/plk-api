import NextAuth, { type Session, type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { cookies } from "next/headers";


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
