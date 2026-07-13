'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n/I18nProvider';
import { updateUserRole } from '@/app/admin/users/actions';
import type { UserRole } from '@/types/profile';

interface RoleSelectProps {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
  userEmail: string | null;
}

export default function RoleSelect({ userId, currentRole, isSelf, userEmail }: RoleSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
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
    <div className="relative w-full md:w-auto flex flex-col items-end" ref={dropdownRef}>
      <button
        onClick={() => !isSelf && !isPending && setIsOpen(!isOpen)}
        disabled={isPending || isSelf}
        title={isSelf ? t('admin.users.cannotChangeSelf') : undefined}
        className={`inline-flex items-center px-4 py-2 border text-xs font-medium rounded-lg transition-colors w-full md:w-auto justify-center cursor-pointer select-none ${
          isSelf
            ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
            : isPending
            ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-wait'
            : isOpen
            ? 'border-primary bg-primary text-white shadow-md'
            : 'border-nordic/10 bg-white text-nordic hover:bg-nordic hover:text-white dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-nordic'
        }`}
      >
        {isPending ? t('admin.users.updating') : t('admin.users.changeRole')}
        <span className="material-icons text-[16px] ml-2">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 rounded-lg shadow-dropdown bg-primary ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden z-50 origin-top-right transition-all">
          <div className="py-1" role="menu">
            {/* Administrator option */}
            <button
              onClick={() => handleRoleChange('admin')}
              className={`w-full group flex items-center px-4 py-3 text-xs text-left transition-colors cursor-pointer ${
                role === 'admin'
                  ? 'bg-white/20 font-medium text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              role="menuitem"
            >
              <span className={`material-icons text-sm mr-3 ${role === 'admin' ? 'text-white' : 'text-white/50 group-hover:text-white'}`}>
                shield
              </span>
              {t('admin.users.roleAdmin')}
            </button>

            {/* User option */}
            <button
              onClick={() => handleRoleChange('user')}
              className={`w-full group flex items-center px-4 py-3 text-xs text-left transition-colors cursor-pointer ${
                role === 'user'
                  ? 'bg-white/20 font-medium text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              role="menuitem"
            >
              <span className={`material-icons text-sm mr-3 ${role === 'user' ? 'text-white' : 'text-white/50 group-hover:text-white'}`}>
                person
              </span>
              {t('admin.users.roleUser')}
            </button>

            <div className="border-t border-white/10 my-1"></div>

            {/* Suspend User option (Mock Action) */}
            <button
              onClick={() => {
                alert(t('admin.users.suspensionMocked'));
                setIsOpen(false);
              }}
              className="w-full group flex items-center px-4 py-3 text-xs text-left text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors cursor-pointer"
              role="menuitem"
            >
              <span className="material-icons text-sm mr-3 text-red-300 group-hover:text-red-100">
                block
              </span>
              {t('admin.users.suspendUser')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <span className="text-xs text-red-600 mt-1 whitespace-nowrap">{error}</span>
      )}
    </div>
  );
}
