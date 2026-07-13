import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FeaturedCollection from '@/components/FeaturedCollection';
import NewInMarket from '@/components/NewInMarket';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { mapDatabaseProperty } from '@/lib/property-mapper';
import { getTranslationServer } from '@/i18n/server';

const PAGE_SIZE = 8;

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    propertyType?: string;
    beds?: string;
    baths?: string;
    amenities?: string;
    listingType?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const {
    page,
    location,
    minPrice,
    maxPrice,
    propertyType,
    beds,
    baths,
    amenities,
    listingType,
  } = await searchParams;

  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('status', 'active');


  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  // Convert prices to cents (stored as cents in Supabase)
  if (minPrice) {
    const minVal = parseInt(minPrice, 10);
    if (!isNaN(minVal)) {
      query = query.gte('price', minVal * 100);
    }
  }

  if (maxPrice) {
    const maxVal = parseInt(maxPrice, 10);
    if (!isNaN(maxVal)) {
      query = query.lte('price', maxVal * 100);
    }
  }

  if (propertyType && propertyType !== 'Any Type' && propertyType !== 'any') {
    query = query.eq('property_type', propertyType.toLowerCase());
  }

  if (beds && beds !== 'any') {
    const bedsNum = parseInt(beds.replace('+', ''), 10);
    if (!isNaN(bedsNum)) {
      query = query.eq('beds', bedsNum);
    }
  }

  if (baths && baths !== 'any') {
    const bathsNum = parseInt(baths.replace('+', ''), 10);
    if (!isNaN(bathsNum)) {
      // Match exact integer value: e.g. baths=2 matches 2.0 and 2.5
      query = query.gte('baths', bathsNum).lt('baths', bathsNum + 1);
    }
  }

  if (listingType && listingType !== 'all') {
    query = query.eq('listing_type', listingType === 'rent' ? 'for_rent' : 'for_sale');
  }

  if (amenities) {
    const list = amenities.split(',');
    for (const am of list) {
      let term = am.trim().toLowerCase();
      if (term === 'swimming pool') term = 'pool';
      else if (term === 'gym') term = 'gym';
      else if (term === 'parking') term = 'parking';
      else if (term === 'air conditioning') term = 'conditioning';
      else if (term === 'high-speed wifi') term = 'wifi';
      else if (term === 'patio / terrace') term = 'patio';

      query = query.ilike('description', `%${term}%`);
    }
  }

  const { data: properties, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { dict } = await getTranslationServer();

  const mappedProperties = (properties ?? []).map((p) => {
    const property = mapDatabaseProperty(p);
    const translated = dict.propertiesData?.[property.slug || ''];
    if (translated) {
      property.title = translated.title || property.title;
      property.description = translated.description || property.description;
      property.location = translated.location || property.location;
    }
    return property;
  });

  const hasActiveFilters = !!(
    location ||
    (propertyType && propertyType !== 'all' && propertyType !== 'any') ||
    (beds && beds !== 'any') ||
    (baths && baths !== 'any') ||
    (amenities && amenities.trim().length > 0) ||
    (minPrice && parseInt(minPrice, 10) > 100000) ||
    (maxPrice && parseInt(maxPrice, 10) < 10000000)
  );

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Hero />
        {!hasActiveFilters && <FeaturedCollection />}
        <NewInMarket
          properties={mappedProperties}
          totalCount={count ?? 0}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
        />
      </main>
      <Footer />
    </>
  );
}

