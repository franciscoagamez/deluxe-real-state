'use client';

import { useState, useTransition } from 'react';
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    const previousRole = role;
    setRole(newRole);
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (!result.success) {
        setRole(previousRole);
        setError(result.error ?? 'Failed to update role');
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        onChange={handleChange}
        disabled={isPending || isSelf}
        title={isSelf ? t('admin.users.cannotChangeSelf') : undefined}
        className="border border-nordic/10 rounded-lg text-sm px-3 py-2 bg-white text-nordic focus:ring-2 focus:ring-mosque disabled:opacity-50"
      >
        <option value="user">{t('admin.users.roleUser')}</option>
        <option value="admin">{t('admin.users.roleAdmin')}</option>
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
