'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminNavbarLinksProps {
  propertiesLabel: string;
  usersLabel: string;
}

export default function AdminNavbarLinks({
  propertiesLabel,
  usersLabel,
}: AdminNavbarLinksProps) {
  const pathname = usePathname();

  const isPropertiesActive = pathname ? pathname.startsWith('/admin/properties') : false;
  const isUsersActive = pathname ? pathname.startsWith('/admin/users') : false;

  return (
    <nav className="hidden md:flex gap-8">
      <Link
        href="/admin/properties"
        className={`text-sm font-medium py-1 px-1 transition-all ${
          isPropertiesActive
            ? 'text-mosque font-semibold border-b-2 border-mosque'
            : 'text-nordic/70 hover:text-mosque hover:border-b-2 hover:border-mosque/20'
        }`}
      >
        {propertiesLabel}
      </Link>
      <Link
        href="/admin/users"
        className={`text-sm font-medium py-1 px-1 transition-all ${
          isUsersActive
            ? 'text-mosque font-semibold border-b-2 border-mosque'
            : 'text-nordic/70 hover:text-mosque hover:border-b-2 hover:border-mosque/20'
        }`}
      >
        {usersLabel}
      </Link>
    </nav>
  );
}
