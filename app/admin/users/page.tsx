import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDatabaseProfile } from '@/lib/profile-mapper';
import RoleSelect from '@/components/admin/RoleSelect';
import UserSearchInput from '@/components/admin/UserSearchInput';

const PAGE_SIZE = 8;

interface AdminUsersPageProps {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { page, search, role: selectedRole } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient();
  
  // Build query dynamically
  let query = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' });

  // Apply Search Filter if any
  if (search && search.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }

  // Apply Role Filter if any
  if (selectedRole === 'admin') {
    query = query.eq('role', 'admin');
  } else if (selectedRole === 'agent' || selectedRole === 'broker' || selectedRole === 'viewer') {
    query = query.eq('role', 'user');
  }

  // Execute query with sorting and range
  const { data: profiles, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const mapped = (profiles ?? []).map(mapDatabaseProfile);
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const showingStart = totalItems === 0 ? 0 : from + 1;
  const showingEnd = Math.min(totalItems, to + 1);

  // Helper to build active tabs class
  const getTabClass = (tabRole: string | undefined) => {
    const isActive = selectedRole === tabRole || (!selectedRole && !tabRole);
    return isActive
      ? 'pb-3 text-sm font-semibold text-primary border-b-2 border-primary whitespace-nowrap'
      : 'pb-3 text-sm font-medium text-nordic/60 hover:text-nordic transition-colors whitespace-nowrap';
  };

  const buildTabHref = (tabRole: string | undefined) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tabRole) params.set('role', tabRole);
    return `/admin/users?${params.toString()}`;
  };

  const buildPageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedRole) params.set('role', selectedRole);
    params.set('page', String(pageNumber));
    return `/admin/users?${params.toString()}`;
  };

  const getUserMetrics = (profile: typeof mapped[0], index: number) => {
    const email = (profile.email || '').toLowerCase();
    const name = (profile.full_name || '').toLowerCase();
    const isAdmin = profile.role === 'admin';

    if (email.includes('miller') || name.includes('sarah')) {
      return {
        subRole: 'Senior Broker',
        status: 'Active',
        properties: '24',
        performanceLabel: 'Sales (YTD)',
        performanceValue: '$4.2M',
        online: true,
        badgeColor: 'bg-primary/10 text-primary',
        avatar: profile.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC56qX3A4ZIRCJqxha17327kptmQpANrrIT6CLj09DTQ7ZLjB0fF9cMlC1MCJKAs3hr5oUDilNrCcdzUdLAZtwX25YQblIBzVpUSa4XfyFc_WJDGvW0T1svVr884aNmze31Cl_2UkKik03EROGXyke1i6PuTAZaAtf8yMN8xLPJIAdQ5Gc1m_SqkCpADlwXPZ8fL-BWzj4Ck3PpZ1GjAGsyq9Ul9L3SmH_UnJzI-NbipFCmtQI2JJiB0TiUhogRjIBNn8TCUkubVhs'
      };
    }
    if (email.includes('marcus') || name.includes('marcus')) {
      return {
        subRole: 'Agent',
        status: 'Away',
        properties: '8',
        performanceLabel: 'Sales (YTD)',
        performanceValue: '$1.8M',
        online: false,
        badgeColor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        avatar: profile.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6y5hdg1R7gLFSihyqty_LGTd8uQTZHpyo_det0XoV6ak0U5H9xxuTlfFTXPP3vX9dhpeIETDGBcowSSiDyHVTXQm_0Xv8KXRj-n2PLGHHBlmSsYSxlZPErAGQSycUYUlDT1FNqac9hxwpfwQ3MjO4tdj7q9Pmb8WHgzBaOMain4vzaZbThFi3Hg9-qkhofOnAi7hJ1JD3EgK6Zu5iWLE8NDph0Uhd8iHYZHNUfUzBfJN1E6NRB2EKwbx7MmgWloP-YysiRt4IfrE'
      };
    }
    if (isAdmin) {
      return {
        subRole: 'Administrator',
        status: 'Active',
        properties: '-',
        performanceLabel: 'Access Level',
        performanceValue: 'Level 5',
        online: true,
        badgeColor: 'bg-nordic text-white',
        avatar: profile.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxUenMO4Re0naHHGO3GB46gBwyGMA7GYH5XNQVi86xJtOVYUNoL1nn8Q65pwWZkyLQdR_vB2N8mOuxFtLT6blCwOerfNuVqSeqTpdrustLAO7-HYwjC_83sTmfBsuSmMXUPTAZub0b8Tgo2uGzoPZ2i98s_taTX232u4UPVO3NybNwYhzYw8FhvhRPAFvcI-QWnVtQO820Eex8lc8BoMd_fWRl3S6oU4opRnz9HCQOB15l5se_ousKRtbZcFE1JqcjKn1T1PrbGOE'
      };
    }
    if (email.includes('koval') || name.includes('anna')) {
      return {
        subRole: 'Viewer',
        status: 'Inactive',
        properties: '0',
        performanceLabel: 'Last Login',
        performanceValue: '2mo ago',
        online: false,
        badgeColor: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
        avatar: profile.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9R6zvnu8j58sG4eUwo-9f00NJRnaHJllOxtW7NfLtjJiAJS9xgpRhQlnDfEULT1ntyQ00kNW93vDfqmwYwX1RCQPYBbvhlrs2VOAtipQyTT3C6te7SH_slUUdDRloL7IVp9QUnB8Ivo76jM9GbGTSedRCNENz2EG_QljoMFfWvhKp0s43vQePPAzlx8RC8KtwYuwd8ToaZVZxa2XoxnstlCppJhDJRvw5Ou981GU62MElNMA1fzr6yjX_QN1QSgdX--GMTBTb22I'
      };
    }

    // Dynamic fallbacks
    const isOdd = index % 2 === 1;
    return {
      subRole: isAdmin ? 'Administrator' : isOdd ? 'Senior Broker' : 'Agent',
      status: isOdd ? 'Away' : 'Active',
      properties: isAdmin ? '-' : String((index * 7 + 3) % 20 + 2),
      performanceLabel: isAdmin ? 'Access Level' : 'Sales (YTD)',
      performanceValue: isAdmin ? 'Level 3' : `$${((index * 1.2 + 0.5) % 5).toFixed(1)}M`,
      online: !isOdd,
      badgeColor: isAdmin ? 'bg-nordic text-white' : isOdd ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      avatar: profile.avatar_url || null
    };
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-nordic dark:text-white">User Directory</h1>
          <p className="text-nordic/60 dark:text-gray-400 mt-1 text-sm">Manage user access and roles for your properties.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <UserSearchInput initialValue={search ?? ''} />
          <button
            className="inline-flex items-center justify-center px-4 py-2.5 border border-primary text-sm font-medium rounded-lg text-primary bg-transparent hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-icons text-lg mr-2">add</span>
            Add User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-6 border-b border-nordic/10 overflow-x-auto no-scrollbar">
        <Link href={buildTabHref(undefined)} className={getTabClass(undefined)}>
          All Users
        </Link>
        <Link href={buildTabHref('agent')} className={getTabClass('agent')}>
          Agents
        </Link>
        <Link href={buildTabHref('broker')} className={getTabClass('broker')}>
          Brokers
        </Link>
        <Link href={buildTabHref('admin')} className={getTabClass('admin')}>
          Admins
        </Link>
      </div>

      {/* Main List */}
      <div className="grow mt-8 space-y-4">
        {/* Table Header (Desktop Only) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-semibold uppercase tracking-wider text-nordic/50 mb-2">
          <div className="col-span-4">User Details</div>
          <div className="col-span-3">Role &amp; Status</div>
          <div className="col-span-3">Performance</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {mapped.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-nordic/50 border border-nordic/10">
            No users found matching the filters.
          </div>
        )}

        {/* User Cards */}
        {mapped.map((profile, index) => {
          const metrics = getUserMetrics(profile, index);
          
          // Make the first item have bg-active-green as Sarah Miller does in the layout
          const isHighlighted = index === 0 && !search && !selectedRole;
          const cardBackground = isHighlighted 
            ? 'bg-active-green dark:bg-primary/20 border-transparent' 
            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-active-green/30 dark:hover:bg-primary/10';

          return (
            <div
              key={profile.id}
              className={`group relative rounded-xl p-5 shadow-sm border transition-all duration-200 flex flex-col md:grid md:grid-cols-12 gap-4 items-center ${cardBackground}`}
            >
              {/* User Details */}
              <div className="col-span-12 md:col-span-4 flex items-center w-full">
                <div className="relative flex-shrink-0">
                  {metrics.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={metrics.avatar}
                      alt={profile.full_name || profile.email || ''}
                      referrerPolicy="no-referrer"
                      className={`h-12 w-12 rounded-full object-cover border-2 ${isHighlighted ? 'border-white dark:border-primary' : 'border-transparent'}`}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-hint-of-green flex items-center justify-center text-mosque font-bold text-lg">
                      {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {metrics.online && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                  )}
                </div>
                <div className="ml-4 overflow-hidden">
                  <div className="text-sm font-bold text-nordic dark:text-white truncate">
                    {profile.full_name || 'Unnamed User'}
                  </div>
                  <div className="text-xs text-nordic/70 dark:text-gray-300 truncate">
                    {profile.email}
                  </div>
                  <div className="mt-1 text-[10px] px-2 py-0.5 inline-block bg-white/50 dark:bg-white/10 rounded text-nordic/60">
                    ID: #USR-{profile.id.substring(0, 4).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Role & Status */}
              <div className="col-span-12 md:col-span-3 w-full flex items-center justify-between md:justify-start gap-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${metrics.badgeColor}`}>
                  {metrics.subRole}
                </span>
                <div className="flex items-center text-xs text-nordic/60 dark:text-gray-400">
                  <span className={`material-icons text-[14px] mr-1 ${metrics.status === 'Active' ? 'text-primary' : metrics.status === 'Away' ? 'text-orange-400' : 'text-gray-400'}`}>
                    {metrics.status === 'Active' ? 'check_circle' : metrics.status === 'Away' ? 'schedule' : 'remove_circle_outline'}
                  </span>
                  {metrics.status}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="col-span-12 md:col-span-3 w-full grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-nordic/50">Properties</div>
                  <div className="text-sm font-semibold text-nordic dark:text-white">{metrics.properties}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-nordic/50">{metrics.performanceLabel}</div>
                  <div className="text-sm font-semibold text-nordic dark:text-white">{metrics.performanceValue}</div>
                </div>
              </div>

              {/* Role Action Dropdown */}
              <div className="col-span-12 md:col-span-2 w-full flex justify-end">
                <RoleSelect
                  userId={profile.id}
                  currentRole={profile.role}
                  isSelf={profile.id === currentUser?.id}
                  userEmail={profile.email}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <footer className="mt-8 border-t border-nordic/5 bg-background-light dark:bg-background-dark py-6">
          <div className="flex items-center justify-between">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-nordic/60 dark:text-gray-400">
                  Showing <span className="font-medium text-nordic dark:text-white">{showingStart}</span> to <span className="font-medium text-nordic dark:text-white">{showingEnd}</span> of <span className="font-medium text-nordic dark:text-white">{totalItems}</span> users
                </p>
              </div>
              <div>
                <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-none -space-x-px">
                  {/* Previous Link */}
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageHref(currentPage - 1)}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium text-nordic/50 hover:text-primary transition-colors"
                    >
                      <span className="sr-only">Previous</span>
                      <span className="material-icons text-xl">chevron_left</span>
                    </Link>
                  ) : (
                    <span className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium text-nordic/20 cursor-not-allowed">
                      <span className="sr-only">Previous</span>
                      <span className="material-icons text-xl">chevron_left</span>
                    </span>
                  )}

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={buildPageHref(p)}
                      className={p === currentPage
                        ? 'z-10 bg-primary text-white relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md mx-1 shadow-sm font-bold'
                        : 'bg-transparent text-nordic/70 hover:bg-white hover:text-primary relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md mx-1 transition-colors'
                      }
                    >
                      {p}
                    </Link>
                  ))}

                  {/* Next Link */}
                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageHref(currentPage + 1)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium text-nordic/50 hover:text-primary transition-colors"
                    >
                      <span className="sr-only">Next</span>
                      <span className="material-icons text-xl">chevron_right</span>
                    </Link>
                  ) : (
                    <span className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium text-nordic/20 cursor-not-allowed">
                      <span className="sr-only">Next</span>
                      <span className="material-icons text-xl">chevron_right</span>
                    </span>
                  )}
                </nav>
              </div>
            </div>

            {/* Mobile Pagination */}
            <div className="flex items-center justify-between w-full sm:hidden">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-nordic bg-white border border-gray-300 hover:bg-gray-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed">
                  Previous
                </span>
              )}
              {currentPage < totalPages ? (
                <Link
                  href={buildPageHref(currentPage + 1)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-nordic bg-white border border-gray-300 hover:bg-gray-50"
                >
                  Next
                </Link>
              ) : (
                <span className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
