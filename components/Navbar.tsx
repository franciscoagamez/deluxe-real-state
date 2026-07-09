import Link from 'next/link';
import Image from 'next/image';
import { getTranslationServer } from '@/i18n/server';
import LanguageSelector from './LanguageSelector';
import NavbarProfile from './NavbarProfile';
import { createClient } from '@/lib/supabase/server';

const Navbar = async () => {
  const { t } = await getTranslationServer();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // NOTE: `user.role` is the Postgres/Supabase-internal role (always
  // "authenticated"), NOT our app-level role -- must check `profiles` instead.
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  return (
    <nav className="sticky top-0 z-50 bg-clear-day/95 backdrop-blur-md border-b border-nordic/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-nordic flex items-center justify-center">
              <span className="material-icons text-white text-lg font-material-icons">
                apartment
              </span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-nordic">
              LuxeEstate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#"
              className="text-mosque font-medium text-sm border-b-2 border-mosque px-1 py-1"
            >
              {t('nav.buy')}
            </Link>
            <Link
              href="#"
              className="text-nordic/70 hover:text-nordic font-medium text-sm hover:border-b-2 hover:border-nordic/20 px-1 py-1 transition-all"
            >
              {t('nav.rent')}
            </Link>
            <Link
              href="#"
              className="text-nordic/70 hover:text-nordic font-medium text-sm hover:border-b-2 hover:border-nordic/20 px-1 py-1 transition-all"
            >
              {t('nav.sell')}
            </Link>
            <Link
              href="#"
              className="text-nordic/70 hover:text-nordic font-medium text-sm hover:border-b-2 hover:border-nordic/20 px-1 py-1 transition-all"
            >
              {t('nav.savedHomes')}
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            <button className="text-nordic hover:text-mosque transition-colors">
              <span className="material-icons font-material-icons">search</span>
            </button>
            <button className="text-nordic hover:text-mosque transition-colors relative">
              <span className="material-icons font-material-icons">
                notifications_none
              </span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-clear-day"></span>
            </button>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Admin Dashboard Link */}
            {isAdmin && (
              <Link
                href="/admin/properties"
                className="hidden md:flex items-center text-nordic/70 hover:text-mosque transition-colors"
                title="Admin Dashboard"
              >
                <span className="material-icons font-material-icons">shield</span>
              </Link>
            )}

            {/* Profile */}
            <NavbarProfile user={user} />
          </div>
        </div>
      </div>

      {/* Mobile Menu (Hidden by default for now as per design) */}
      <div className="md:hidden border-t border-nordic/5 bg-clear-day overflow-hidden h-0 transition-all duration-300">
        <div className="px-4 py-2 space-y-1">
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-mosque bg-mosque/10"
          >
            {t('nav.buy')}
          </Link>
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-nordic hover:bg-black/5"
          >
            {t('nav.rent')}
          </Link>
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-nordic hover:bg-black/5"
          >
            {t('nav.sell')}
          </Link>
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-nordic hover:bg-black/5"
          >
            {t('nav.savedHomes')}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
