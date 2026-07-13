import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { mapDatabaseProperty } from '@/lib/property-mapper';
import { getTranslationServer } from '@/i18n/server';
import PropertyActionButtons from '@/components/admin/PropertyActionButtons';
import type { PropertyStatus } from '@/types/property';

const PAGE_SIZE = 8;

interface AdminPropertiesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPropertiesPage({
  searchParams,
}: AdminPropertiesPageProps) {
  const { page } = await searchParams;
  const { t } = await getTranslationServer();
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const [{ data: properties, count }, { count: activeCount }, { count: pendingCount }, { count: inactiveCount }] = await Promise.all([
    supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
  ]);

  const mapped = (properties ?? []).map(mapDatabaseProperty);
  const statusById = new Map<string, PropertyStatus>(
    (properties ?? []).map((p) => [p.id, (p.status as PropertyStatus) ?? 'active']),
  );
  const totalCount = count ?? 0;
  const totalActive = activeCount ?? 0;
  const totalPending = pendingCount ?? 0;
  const totalInactive = inactiveCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const showingStart = totalCount === 0 ? 0 : from + 1;
  const showingEnd = Math.min(totalCount, to + 1);

  const buildPageHref = (pageNumber: number) => {
    return `/admin/properties?page=${pageNumber}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] font-display">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-nordic dark:text-white tracking-tight">{t('admin.properties.myProperties')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('admin.properties.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="bg-white dark:bg-[#152e2a] border border-gray-200 dark:border-primary/30 text-nordic dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-primary/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <span className="material-icons text-base">filter_list</span> {t('admin.properties.filter')}
          </button>
          <Link
            href="/admin/properties/new"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer"
          >
            <span className="material-icons text-base">add</span> {t('admin.properties.addNewProperty')}
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.properties.totalListings')}</p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{totalCount}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-icons">apartment</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.properties.activeProperties')}</p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{totalActive}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-hint-of-green flex items-center justify-center text-primary">
            <span className="material-icons">check_circle</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.properties.pendingSale')}</p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{totalPending}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <span className="material-icons">pending</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.properties.inactiveProperties')}</p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{totalInactive}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <span className="material-icons">visibility_off</span>
          </div>
        </div>
      </div>

      {/* Property List Container */}
      <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-200 dark:border-primary/20 overflow-hidden">
        {/* Table Header (Desktop Only) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-primary/5 border-b border-gray-100 dark:border-primary/10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">{t('admin.properties.colDetails')}</div>
          <div className="col-span-2">{t('admin.properties.colPrice')}</div>
          <div className="col-span-2">{t('admin.properties.colStatus')}</div>
          <div className="col-span-2 text-right">{t('admin.properties.colActions')}</div>
        </div>

        {mapped.length === 0 && (
          <div className="px-6 py-10 text-center text-nordic-muted text-sm bg-white dark:bg-transparent">
            {t('admin.properties.noProperties')}
          </div>
        )}

        {/* List Items */}
        {mapped.map((property) => {
          const status = statusById.get(property.id) ?? 'active';

          const formattedPrice = property.price.toLocaleString();

          // Subtext calculation
          let priceSubtext = '';
          if (status === 'sold') {
            priceSubtext = t('admin.properties.sold');
          } else if (property.type === 'rent') {
            priceSubtext = `${t('admin.properties.monthly')}: $${formattedPrice}`;
          } else {
            // Simulated estimated monthly payment
            const monthlyEst = Math.round(property.price * 0.0036);
            priceSubtext = `${t('admin.properties.monthly')}: $${monthlyEst.toLocaleString()}`;
          }

          return (
            <div
              key={property.id}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-gray-100 dark:border-primary/10 hover:bg-background-light dark:hover:bg-primary/5 transition-colors items-center"
            >
              {/* Property Details */}
              <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                <div className="relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-primary/10">
                  {property.images[0] ? (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="112px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-nordic/5 text-nordic/30">
                      <span className="material-icons text-2xl">image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-nordic dark:text-white group-hover:text-primary transition-colors cursor-pointer">
                    {property.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{property.location}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">bed</span> {property.beds} {t('property.beds')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">bathtub</span> {property.baths} {t('property.baths')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>
                      {property.sqft.toLocaleString()} {t('property.sqft')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="col-span-6 md:col-span-2">
                <div className="text-base font-semibold text-nordic dark:text-gray-200">
                  ${formattedPrice}
                </div>
                <div className="text-xs text-gray-400">{priceSubtext}</div>
              </div>

              {/* Status */}
              <div className="col-span-6 md:col-span-2">
                {status === 'active' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hint-of-green text-primary border border-primary/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                    {t('admin.properties.active')}
                  </span>
                )}
                {status === 'pending' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
                    {t('admin.properties.pending')}
                  </span>
                )}
                {status === 'sold' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span>
                    {t('admin.properties.sold')}
                  </span>
                )}
                {status === 'inactive' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                    {t('admin.properties.inactive')}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                <Link
                  href={`/admin/properties/${property.id}/edit`}
                  className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-hint-of-green/30 transition-all cursor-pointer"
                  title={t('admin.properties.editProperty')}
                >
                  <span className="material-icons text-xl">edit</span>
                </Link>
                <PropertyActionButtons propertyId={property.id} status={status} />
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-primary/20 flex items-center justify-between bg-gray-50/50 dark:bg-primary/5">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('admin.properties.showingResults', {
                start: showingStart,
                end: showingEnd,
                total: totalCount,
              })}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-primary/20 transition-colors"
                >
                  {t('admin.properties.previous')}
                </Link>
              ) : (
                <span className="px-3 py-1 text-sm border border-gray-100 dark:border-primary/10 rounded-md text-gray-300 bg-gray-50/50 cursor-not-allowed opacity-50">
                  {t('admin.properties.previous')}
                </span>
              )}
              {currentPage < totalPages ? (
                <Link
                  href={buildPageHref(currentPage + 1)}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-primary/20 transition-colors"
                >
                  {t('admin.properties.next')}
                </Link>
              ) : (
                <span className="px-3 py-1 text-sm border border-gray-100 dark:border-primary/10 rounded-md text-gray-300 bg-gray-50/50 cursor-not-allowed opacity-50">
                  {t('admin.properties.next')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
