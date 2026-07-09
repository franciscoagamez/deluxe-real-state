import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDatabaseProfile } from '@/lib/profile-mapper';
import { getTranslationServer } from '@/i18n/server';
import Pagination from '@/components/Pagination';
import RoleSelect from '@/components/admin/RoleSelect';

const PAGE_SIZE = 8;

interface AdminUsersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient();
  const { data: profiles, count } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { t } = await getTranslationServer();
  const mapped = (profiles ?? []).map(mapDatabaseProfile);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-3xl font-bold text-nordic">{t('admin.users.title')}</h1>
      <p className="text-nordic-muted mt-1 mb-8">{t('admin.users.subtitle')}</p>

      <div className="space-y-3">
        {mapped.map((profile) => (
          <div
            key={profile.id}
            className="bg-white rounded-xl p-5 shadow-card border border-nordic/10 flex flex-col md:grid md:grid-cols-12 gap-4 items-center"
          >
            <div className="col-span-12 md:col-span-6 flex items-center gap-4 w-full">
              {profile.avatar_url ? (
                // Plain <img>, not next/image: GitHub avatars come from
                // avatars.githubusercontent.com, which is not in
                // next.config.ts's images.remotePatterns (only
                // lh3.googleusercontent.com and images.unsplash.com are).
                // components/NavbarProfile.tsx already uses a plain <img>
                // for this exact reason.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name ?? profile.email ?? ''}
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-hint-of-green flex items-center justify-center text-mosque font-bold">
                  {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-bold text-nordic">
                  {profile.full_name || t('admin.users.unnamed')}
                </div>
                <div className="text-xs text-nordic-muted">{profile.email}</div>
              </div>
            </div>
            <div className="col-span-6 md:col-span-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                  profile.role === 'admin'
                    ? 'bg-nordic text-white'
                    : 'bg-hint-of-green text-mosque'
                }`}
              >
                {profile.role === 'admin'
                  ? t('admin.users.roleAdmin')
                  : t('admin.users.roleUser')}
              </span>
            </div>
            <div className="col-span-6 md:col-span-3 flex justify-end w-full">
              <RoleSelect
                userId={profile.id}
                currentRole={profile.role}
                isSelf={profile.id === currentUser?.id}
              />
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/users"
      />
    </div>
  );
}
