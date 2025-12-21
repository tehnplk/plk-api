import { redirect } from 'next/navigation';
import { getAdminAuthContext } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, Home, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get provider_id from session
  const { session, providerId, displayNameFromProfile, user } = await getAdminAuthContext();

  if (!session?.user) {
    redirect('/login');
  }

  if (!user || !user.active) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/home');
  }

  const dbDisplayName = user.full_name_th || user.full_name_en || user.email || providerId;
  const resolvedDisplayName = displayNameFromProfile && displayNameFromProfile !== providerId ? displayNameFromProfile : dbDisplayName;
  const avatarInitial = (resolvedDisplayName || 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 shadow-sm border-b sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 transition-colors"
                aria-label="Back to Admin Portal"
                title="Back to Admin Portal"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <div className="leading-tight">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900">Admin Panel</h1>
                <div className="text-xs text-gray-500">Admin Portal & Tools</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">
                    {resolvedDisplayName}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 truncate max-w-[220px]">{providerId}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <Shield className="h-3 w-3" />
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/home"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4 text-gray-500" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
