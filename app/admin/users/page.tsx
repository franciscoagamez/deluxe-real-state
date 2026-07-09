import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDatabaseProfile } from '@/lib/profile-mapper';
import { getTranslationServer } from '@/i18n/server';
import RoleSelect from '@/components/admin/RoleSelect';
import AdminSearchInput from '@/components/admin/AdminSearchInput';

const PAGE_SIZE = 8;

interface AdminUsersPageProps {
  searchParams: Promise<{ page?: string; q?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { page, q, role } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const searchQuery = q ?? '';
  const roleFilter = role ?? 'all';

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' });

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }

  if (roleFilter !== 'all') {
    query = query.eq('role', roleFilter);
  }

  const { data: profiles, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { t } = await getTranslationServer();
  const mapped = (profiles ?? []).map(mapDatabaseProfile);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const startItem = count === 0 ? 0 : from + 1;
  const endItem = Math.min(count ?? 0, to + 1);

  const showingText = (t('admin.users.showingUsers') || 'Showing {start} to {end} of {total} users')
    .replace('{start}', String(startItem))
    .replace('{end}', String(endItem))
    .replace('{total}', String(count ?? 0));

  const buildTabHref = (targetRole: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (targetRole !== 'all') params.set('role', targetRole);
    params.set('page', '1');
    return `/admin/users?${params.toString()}`;
  };

  const buildPageHref = (pageNum: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    params.set('page', String(pageNum));
    return `/admin/users?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col min-h-[70vh]">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-nordic dark:text-white">
            {t('admin.users.title')}
          </h1>
          <p className="text-nordic-muted dark:text-gray-400 mt-1 text-sm">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <AdminSearchInput placeholder={t('admin.users.searchPlaceholder') || 'Search by name, email...'} />
          <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-primary text-sm font-medium rounded-lg text-primary bg-transparent hover:bg-primary/5 focus:outline-none transition-colors whitespace-nowrap">
            <span className="material-icons text-lg mr-2">add</span>
            {t('admin.users.addUser') || 'Add User'}
          </button>
        </div>
      </div>

      {/* Tabs / filters */}
      <div className="flex gap-6 border-b border-nordic/10 overflow-x-auto scrollbar-none mb-8">
        <Link
          href={buildTabHref('all')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
            roleFilter === 'all'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-nordic/60 hover:text-nordic'
          }`}
        >
          {t('admin.users.allUsers') || 'All Users'}
        </Link>
        <Link
          href={buildTabHref('user')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
            roleFilter === 'user'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-nordic/60 hover:text-nordic'
          }`}
        >
          {t('admin.users.roleUser') || 'User'}s
        </Link>
        <Link
          href={buildTabHref('admin')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
            roleFilter === 'admin'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-nordic/60 hover:text-nordic'
          }`}
        >
          {t('admin.users.roleAdmin') || 'Admin'}s
        </Link>
      </div>

      {/* User cards list */}
      <div className="grow space-y-4">
        {/* Table headers for md+ screens */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-semibold uppercase tracking-wider text-nordic/50 mb-2">
          <div className="col-span-4">{t('admin.users.userDetails') || 'User Details'}</div>
          <div className="col-span-3">{t('admin.users.roleStatus') || 'Role & Status'}</div>
          <div className="col-span-3">{t('admin.users.performance') || 'Performance'}</div>
          <div className="col-span-2 text-right">{t('admin.users.actions') || 'Actions'}</div>
        </div>

        {mapped.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-nordic-muted border border-nordic/10 shadow-sm">
            {t('listings.noProperties') || 'No users found'}
          </div>
        ) : (
          mapped.map((profile) => {
            const isSelf = profile.id === currentUser?.id;
            return (
              <div
                key={profile.id}
                className={`user-card group relative rounded-xl p-5 shadow-sm border transition-colors flex flex-col md:grid md:grid-cols-12 gap-4 items-center ${
                  isSelf
                    ? 'bg-accent/30 border-primary/20'
                    : 'bg-white dark:bg-gray-800 border-nordic/10 hover:bg-accent/20'
                }`}
              >
                {/* User Details */}
                <div className="col-span-12 md:col-span-4 flex items-center w-full">
                  <div className="relative flex-shrink-0">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name ?? profile.email ?? ''}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-primary shadow-sm"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-hint-of-green flex items-center justify-center text-mosque font-bold border-2 border-white shadow-sm">
                        {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
                  </div>
                  <div className="ml-4 overflow-hidden">
                    <div className="text-sm font-bold text-nordic dark:text-white truncate">
                      {profile.full_name || t('admin.users.unnamed')}
                    </div>
                    <div className="text-xs text-nordic/70 dark:text-gray-300 truncate">
                      {profile.email}
                    </div>
                    <div className="mt-1 text-[10px] px-2 py-0.5 inline-block bg-white/50 dark:bg-white/10 rounded text-nordic/60 font-mono">
                      ID: #USR-{profile.id.substring(0, 4).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Role & Status */}
                <div className="col-span-12 md:col-span-3 w-full flex items-center justify-between md:justify-start gap-4">
                  {profile.role === 'admin' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-nordic text-white">
                      {t('admin.users.roleAdmin')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {t('admin.users.roleUser')}
                    </span>
                  )}
                  <div className="flex items-center text-xs text-nordic/60 dark:text-gray-400">
                    <span className="material-icons text-[14px] mr-1 text-primary">check_circle</span>
                    {t('admin.properties.active') || 'Active'}
                  </div>
                </div>

                {/* Performance Placeholder */}
                <div className="col-span-12 md:col-span-3 w-full grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-nordic/50">
                      {t('admin.users.propertiesCount') || 'Properties'}
                    </div>
                    <div className="text-sm font-semibold text-nordic dark:text-white">
                      {profile.role === 'admin' ? '12' : '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-nordic/50">
                      {t('admin.users.accessLevel') || 'Access Level'}
                    </div>
                    <div className="text-sm font-semibold text-nordic dark:text-white">
                      {profile.role === 'admin' ? 'Level 5' : 'Level 1'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-12 md:col-span-2 w-full flex justify-end">
                  <RoleSelect
                    userId={profile.id}
                    currentRole={profile.role}
                    isSelf={isSelf}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Pagination */}
      {totalPages > 1 && (
        <footer className="mt-12 border-t border-nordic/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-nordic/60 dark:text-gray-400">
              {showingText}
            </p>
          </div>
          <div>
            <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-none -space-x-px">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium text-nordic/50 hover:text-primary transition-colors"
                >
                  <span className="sr-only">Previous</span>
                  <span className="material-icons text-xl">chevron_left</span>
                </Link>
              ) : (
                <span className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium text-nordic/30 cursor-not-allowed">
                  <span className="sr-only">Previous</span>
                  <span className="material-icons text-xl">chevron_left</span>
                </span>
              )}

              {pages.map((pageNum) => (
                <Link
                  key={pageNum}
                  href={buildPageHref(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md mx-1 transition-colors ${
                    pageNum === currentPage
                      ? 'z-10 bg-primary text-white shadow-sm'
                      : 'bg-transparent text-nordic/70 hover:bg-white hover:text-primary'
                  }`}
                >
                  {pageNum}
                </Link>
              ))}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageHref(currentPage + 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium text-nordic/50 hover:text-primary transition-colors"
                >
                  <span className="sr-only">Next</span>
                  <span className="material-icons text-xl">chevron_right</span>
                </Link>
              ) : (
                <span className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium text-nordic/30 cursor-not-allowed">
                  <span className="sr-only">Next</span>
                  <span className="material-icons text-xl">chevron_right</span>
                </span>
              )}
            </nav>
          </div>
        </footer>
      )}
    </div>
  );
}
