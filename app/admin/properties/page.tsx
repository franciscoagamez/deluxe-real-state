import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { mapDatabaseProperty } from '@/lib/property-mapper';
import { getTranslationServer } from '@/i18n/server';
import AdminSearchInput from '@/components/admin/AdminSearchInput';

const PAGE_SIZE = 8;

interface AdminPropertiesPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminPropertiesPage({
  searchParams,
}: AdminPropertiesPageProps) {
  const { page, q } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const searchQuery = q ?? '';

  const supabase = await createClient();

  // Fast counts for stats cards
  const { count: totalCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  const { count: saleCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('listing_type', 'for_sale');

  const { count: rentCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('listing_type', 'for_rent');

  // Query properties for page list
  let listQuery = supabase
    .from('properties')
    .select('*', { count: 'exact' });

  if (searchQuery) {
    listQuery = listQuery.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
  }

  const { data: properties, count } = await listQuery
    .order('created_at', { ascending: false })
    .range(from, to);

  const { t } = await getTranslationServer();
  const mapped = (properties ?? []).map(mapDatabaseProperty);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const startItem = count === 0 ? 0 : from + 1;
  const endItem = Math.min(count ?? 0, to + 1);

  const showingText = (t('admin.properties.showingResults') || 'Showing {start} to {end} of {total} results')
    .replace('{start}', String(startItem))
    .replace('{end}', String(endItem))
    .replace('{total}', String(count ?? 0));

  const buildPageHref = (pageNum: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('page', String(pageNum));
    return `/admin/properties?${params.toString()}`;
  };

  return (
    <div className="flex flex-col min-h-[70vh]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-nordic dark:text-white tracking-tight">
            {t('admin.properties.title')}
          </h1>
          <p className="text-nordic-muted dark:text-gray-400 mt-1 text-sm">
            {t('admin.properties.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <AdminSearchInput placeholder={t('filters.locationPlaceholder') || 'City, neighborhood...'} />
          <button className="bg-white border border-nordic/10 text-nordic hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2 whitespace-nowrap">
            <span className="material-icons text-base">filter_list</span>
            {t('admin.properties.filter') || 'Filter'}
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2 whitespace-nowrap">
            <span className="material-icons text-base">add</span>
            {t('admin.properties.addNewProperty') || 'Add New Property'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('admin.properties.totalListings') || 'Total Listings'}
            </p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">
              {totalCount ?? 0}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-icons">apartment</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('admin.properties.forSale') || 'For Sale'}
            </p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">
              {saleCount ?? 0}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center text-primary">
            <span className="material-icons">sell</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('admin.properties.forRent') || 'For Rent'}
            </p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">
              {rentCount ?? 0}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <span className="material-icons">key</span>
          </div>
        </div>
      </div>

      {/* Property List Container */}
      <div className="grow bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-200 dark:border-primary/20 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-primary/5 border-b border-gray-100 dark:border-primary/10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">{t('admin.properties.colDetails') || 'Property Details'}</div>
          <div className="col-span-2">{t('admin.properties.colPrice') || 'Price'}</div>
          <div className="col-span-2">{t('admin.properties.colStatus') || 'Status'}</div>
          <div className="col-span-2 text-right">{t('admin.properties.colActions') || 'Actions'}</div>
        </div>

        {mapped.length === 0 ? (
          <div className="px-6 py-10 text-center text-nordic-muted text-sm">
            {t('listings.noProperties') || 'No properties found'}
          </div>
        ) : (
          mapped.map((property) => (
            <div
              key={property.id}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-gray-100 dark:border-primary/10 last:border-b-0 hover:bg-background-light dark:hover:bg-primary/5 transition-colors items-center"
            >
              {/* Property Details */}
              <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                <div className="relative h-20 w-28 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  <Image
                    src={property.images[0] || ''}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="112px"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-nordic dark:text-white group-hover:text-primary transition-colors cursor-pointer">
                    {property.title}
                  </h3>
                  <p className="text-sm text-nordic-muted dark:text-gray-400">
                    {property.location}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-nordic-muted dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">bed</span>
                      {property.beds} {t('property.beds')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">bathtub</span>
                      {property.baths} {t('property.baths')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>
                      {property.sqft} {t('property.sqftLabel') || 'm²'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="col-span-6 md:col-span-2">
                <div className="text-base font-semibold text-nordic dark:text-gray-200">
                  ${property.price.toLocaleString()}
                </div>
                <div className="text-xs text-nordic-muted">
                  {property.type === 'rent'
                    ? `${t('admin.properties.monthly') || 'Monthly'}: $${property.price.toLocaleString()}`
                    : t('admin.properties.forSale') || 'For Sale'}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-6 md:col-span-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent/30 text-primary border border-primary/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
                  {t('admin.properties.active') || 'Active'}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                <button
                  className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-accent/40 transition-all tooltip-trigger cursor-pointer"
                  title="Edit Property"
                >
                  <span className="material-icons text-xl">edit</span>
                </button>
                <button
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all tooltip-trigger cursor-pointer"
                  title="Delete Property"
                >
                  <span className="material-icons text-xl">delete_outline</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-primary/20 flex items-center justify-between bg-gray-50/50 dark:bg-primary/5">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {showingText}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  className="px-3 py-1 text-sm border border-nordic/10 rounded-md text-nordic hover:bg-white transition-colors"
                >
                  {t('admin.properties.previous') || 'Previous'}
                </Link>
              ) : (
                <span className="px-3 py-1 text-sm border border-nordic/10 rounded-md text-nordic-muted opacity-50 cursor-not-allowed">
                  {t('admin.properties.previous') || 'Previous'}
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageHref(currentPage + 1)}
                  className="px-3 py-1 text-sm border border-nordic/10 rounded-md text-nordic hover:bg-white transition-colors"
                >
                  {t('admin.properties.next') || 'Next'}
                </Link>
              ) : (
                <span className="px-3 py-1 text-sm border border-nordic/10 rounded-md text-nordic-muted opacity-50 cursor-not-allowed">
                  {t('admin.properties.next') || 'Next'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
