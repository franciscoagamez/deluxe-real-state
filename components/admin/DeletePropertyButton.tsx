'use client';

import { useState, useTransition } from 'react';
import { useTranslation } from '@/i18n/I18nProvider';
import { deleteProperty } from '@/app/admin/properties/actions';

interface DeletePropertyButtonProps {
  propertyId: string;
}

export default function DeletePropertyButton({ propertyId }: DeletePropertyButtonProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!window.confirm(t('admin.properties.deleteConfirm'))) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProperty(propertyId);
      if (!result.success) {
        setError(result.error ?? 'Failed to delete property');
      }
    });
  };

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleDelete}
        disabled={isPending}
        title={t('admin.properties.deleteProperty')}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
      >
        <span className="material-icons text-xl">{isPending ? 'hourglass_top' : 'delete_outline'}</span>
      </button>
      {error && <span className="text-xs text-red-600 mt-1 whitespace-nowrap">{error}</span>}
    </div>
  );
}
