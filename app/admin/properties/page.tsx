import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { mapDatabaseProperty } from '@/lib/property-mapper';
import { getTranslationServer } from '@/i18n/server';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 8;

interface AdminPropertiesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPropertiesPage({
  searchParams,
}: AdminPropertiesPageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: properties, count } = await supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { t } = await getTranslationServer();
  const mapped = (properties ?? []).map(mapDatabaseProperty);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-3xl font-bold text-nordic">{t('admin.properties.title')}</h1>
      <p className="text-nordic-muted mt-1 mb-8">{t('admin.properties.subtitle')}</p>

      <div className="bg-white rounded-xl shadow-card border border-nordic/10 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-clear-day/50 border-b border-nordic/10 text-xs font-semibold text-nordic-muted uppercase tracking-wider">
          <div className="col-span-7">{t('admin.properties.colDetails')}</div>
          <div className="col-span-3">{t('admin.properties.colLocation')}</div>
          <div className="col-span-2 text-right">{t('admin.properties.colPrice')}</div>
        </div>

        {mapped.length === 0 && (
          <div className="px-6 py-10 text-center text-nordic-muted text-sm">
            {t('listings.noProperties')}
          </div>
        )}

        {mapped.map((property) => (
          <div
            key={property.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-nordic/10 last:border-b-0 items-center"
          >
            <div className="col-span-12 md:col-span-7 flex gap-4 items-center">
              <div className="relative h-20 w-28 shrink-0 rounded-lg overflow-hidden bg-nordic/5">
                <Image
                  src={property.images[0] || ''}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <div>
                <h3 className="font-bold text-nordic">{property.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-nordic-muted">
                  <span>
                    {property.beds} {t('admin.properties.beds')}
                  </span>
                  <span>
                    {property.baths} {t('admin.properties.baths')}
                  </span>
                  <span>
                    {property.sqft}
                    {t('property.sqft')}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-span-8 md:col-span-3 text-sm text-nordic-muted">
              {property.location}
            </div>
            <div className="col-span-4 md:col-span-2 text-right font-semibold text-nordic">
              ${property.price.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/properties"
      />
    </div>
  );
}
