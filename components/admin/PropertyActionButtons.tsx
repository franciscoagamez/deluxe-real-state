'use client';

import { useState, useTransition } from 'react';
import { useTranslation } from '@/i18n/I18nProvider';
import { deleteProperty, deactivateProperty, reactivateProperty } from '@/app/admin/properties/actions';
import type { PropertyStatus } from '@/types/property';

interface PropertyActionButtonsProps {
  propertyId: string;
  status: PropertyStatus;
}

export default function PropertyActionButtons({ propertyId, status }: PropertyActionButtonsProps) {
  const { t } = useTranslation();
  const [isPendingToggle, startToggleTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isInactive = status === 'inactive';

  const handleToggle = () => {
    const confirmMsg = isInactive
      ? t('admin.properties.reactivateConfirm')
      : t('admin.properties.deactivateConfirm');
    if (!window.confirm(confirmMsg)) return;
    setError(null);
    startToggleTransition(async () => {
      const result = isInactive
        ? await reactivateProperty(propertyId)
        : await deactivateProperty(propertyId);
      if (!result.success) {
        setError(result.error ?? 'Action failed');
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm(t('admin.properties.deleteConfirm'))) return;
    setError(null);
    startDeleteTransition(async () => {
      const result = await deleteProperty(propertyId);
      if (!result.success) {
        setError(result.error ?? 'Failed to delete property');
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        {/* Deactivate / Reactivate toggle */}
        <button
          onClick={handleToggle}
          disabled={isPendingToggle || isPendingDelete}
          title={isInactive ? t('admin.properties.reactivateProperty') : t('admin.properties.deactivateProperty')}
          className={`p-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
            isInactive
              ? 'text-gray-400 hover:text-primary hover:bg-hint-of-green/30'
              : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
          }`}
        >
          <span className="material-icons text-xl">
            {isPendingToggle
              ? 'hourglass_top'
              : isInactive
                ? 'visibility'
                : 'visibility_off'}
          </span>
        </button>

        {/* Hard delete */}
        <button
          onClick={handleDelete}
          disabled={isPendingDelete || isPendingToggle}
          title={t('admin.properties.deleteProperty')}
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          <span className="material-icons text-xl">
            {isPendingDelete ? 'hourglass_top' : 'delete_outline'}
          </span>
        </button>
      </div>

      {error && (
        <span className="text-xs text-red-600 mt-1 whitespace-nowrap">{error}</span>
      )}
    </div>
  );
}
