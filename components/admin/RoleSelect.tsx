'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useTranslation } from '@/i18n/I18nProvider';
import { updateUserRole } from '@/app/admin/users/actions';
import type { UserRole } from '@/types/profile';

interface RoleSelectProps {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
}

export default function RoleSelect({ userId, currentRole, isSelf }: RoleSelectProps) {
  const { t } = useTranslation();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (newRole: UserRole) => {
    if (newRole === role) {
      setIsOpen(false);
      return;
    }
    const previousRole = role;
    setRole(newRole);
    setError(null);
    setIsOpen(false);

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (!result.success) {
        setRole(previousRole);
        setError(result.error ?? 'Failed to update role');
      }
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => !isSelf && !isPending && setIsOpen(!isOpen)}
        disabled={isPending || isSelf}
        title={isSelf ? t('admin.users.cannotChangeSelf') : undefined}
        className={`inline-flex items-center px-4 py-2 border rounded-lg text-xs font-medium justify-center transition-colors w-full md:w-auto ${
          isSelf
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : isPending
            ? 'border-nordic/10 bg-white text-nordic opacity-70 cursor-wait'
            : 'border-nordic/10 bg-white text-nordic hover:bg-nordic hover:text-white cursor-pointer'
        }`}
      >
        {isPending ? (
          <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        ) : (
          <>
            {t('admin.users.changeRole') || 'Change Role'}
            <span className="material-icons text-[16px] ml-2">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </>
        )}
      </button>

      {error && (
        <span className="absolute top-full right-0 mt-1 text-[10px] text-red-600 whitespace-nowrap z-30">
          {error}
        </span>
      )}

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-dropdown bg-primary ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden z-50 origin-top-right animate-fade-in-down">
          <div className="py-1" role="menu">
            <button
              onClick={() => handleSelectRole('admin')}
              className={`w-full text-left group flex items-center px-4 py-3 text-xs transition-colors ${
                role === 'admin'
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              role="menuitem"
            >
              <span className="material-icons text-sm mr-3 text-white/50 group-hover:text-white">
                shield
              </span>
              {t('admin.users.roleAdmin')}
            </button>
            <button
              onClick={() => handleSelectRole('user')}
              className={`w-full text-left group flex items-center px-4 py-3 text-xs transition-colors ${
                role === 'user'
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              role="menuitem"
            >
              <span className="material-icons text-sm mr-3 text-white/50 group-hover:text-white">
                visibility
              </span>
              {t('admin.users.roleUser')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
