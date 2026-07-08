'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';
import { createClient } from '@/lib/supabase/client';

interface NavbarProfileProps {
  user: any; // User object from Supabase (or null)
}

export default function NavbarProfile({ user }: NavbarProfileProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="pl-4 border-l border-nordic/10 ml-2 text-nordic/70 hover:text-mosque font-medium text-sm transition-colors cursor-pointer"
      >
        {t('nav.signIn')}
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <div className="relative pl-2 border-l border-nordic/10 ml-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group focus:outline-none"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-nordic/10 group-hover:ring-mosque/50 transition-all duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mosque/20 to-nordic/10 ring-2 ring-nordic/10 group-hover:ring-mosque/50 transition-all duration-300 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-mosque/70 group-hover:text-mosque transition-colors duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#152e2a] border border-nordic/10 dark:border-primary/20 rounded-lg shadow-lg z-50 p-2">
          <div className="px-3 py-2 border-b border-nordic/10 dark:border-primary/10 mb-1">
            <p className="text-xs text-nordic/50 dark:text-gray-400 font-medium">
              {t('login.loggedInAs')}
            </p>
            <p className="text-sm font-semibold truncate text-nordic dark:text-white mt-0.5">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="material-icons text-sm">logout</span>
            {t('login.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
