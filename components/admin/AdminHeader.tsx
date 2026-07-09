import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getTranslationServer } from '@/i18n/server';
import NavbarProfile from '@/components/NavbarProfile';

export default async function AdminHeader() {
  const { t } = await getTranslationServer();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-nordic/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-nordic flex items-center justify-center">
              <span className="material-icons text-white text-lg font-material-icons">
                apartment
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight text-nordic">
              LuxeEstate
            </span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link
              href="/admin/properties"
              className="text-sm font-medium text-nordic/70 hover:text-mosque transition-colors"
            >
              {t('admin.nav.properties')}
            </Link>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-nordic/70 hover:text-mosque transition-colors"
            >
              {t('admin.nav.users')}
            </Link>
          </nav>
        </div>
        <NavbarProfile user={user} />
      </div>
    </header>
  );
}
