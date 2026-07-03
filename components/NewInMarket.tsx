'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import PropertyCard from './ui/PropertyCard';
import Pagination from './Pagination';
import { Property } from '@/types/property';

interface NewInMarketProps {
  properties: Property[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const NewInMarket = ({
  properties,
  totalCount,
  currentPage,
  pageSize,
}: NewInMarketProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const totalPages = Math.ceil(totalCount / pageSize);
  const activeListingType = searchParams.get('listingType') || 'all';

  const handleSelectListingType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // reset page
    if (type === 'all') {
      params.delete('listingType');
    } else {
      params.set('listingType', type);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-nordic">New in Market</h2>
          <p className="text-nordic-muted mt-1 text-sm">
            Fresh opportunities added this week.
          </p>
        </div>
        <div className="hidden md:flex bg-white p-1 rounded-lg">
          <button
            onClick={() => handleSelectListingType('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeListingType === 'all'
                ? 'bg-nordic text-white shadow-sm'
                : 'text-nordic-muted hover:text-nordic'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleSelectListingType('sale')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeListingType === 'sale'
                ? 'bg-nordic text-white shadow-sm'
                : 'text-nordic-muted hover:text-nordic'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => handleSelectListingType('rent')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeListingType === 'rent'
                ? 'bg-nordic text-white shadow-sm'
                : 'text-nordic-muted hover:text-nordic'
            }`}
          >
            Rent
          </button>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-soft">
          <span className="material-icons text-5xl text-nordic-muted/40 mb-3">home_work</span>
          <p className="text-lg font-medium text-nordic">No properties found</p>
          <p className="text-nordic-muted text-sm mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
    </section>
  );
};

export default NewInMarket;
