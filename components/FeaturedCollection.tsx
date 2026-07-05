import Link from 'next/link';
import { Collection } from '@/data/mockData';
import CollectionCard from './ui/CollectionCard';
import { createClient } from '@/lib/supabase/server';
import { mapDatabaseProperty } from '@/lib/property-mapper';
import { getTranslationServer } from '@/i18n/server';

const FeaturedCollection = async () => {
  const supabase = await createClient();
  const { t, dict, locale } = await getTranslationServer();

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('is_featured', true)
    .limit(2);

  const mappedProperties = (properties || []).map(mapDatabaseProperty);

  const collections: (Collection & { slug: string })[] = mappedProperties.map((p) => {
    const slug = p.slug || '';
    const translated = dict.propertiesData?.[slug];
    
    // Localize tags
    let tag = p.is_new ? 'New Arrival' : 'Exclusive';
    if (p.is_new) {
      tag = locale === 'es' ? 'Novedad' : locale === 'fr' ? 'Nouveauté' : 'New Arrival';
    } else {
      tag = locale === 'es' ? 'Exclusivo' : locale === 'fr' ? 'Exclusif' : 'Exclusive';
    }

    return {
      id: p.id,
      title: translated?.title || p.title,
      location: translated?.location || p.location,
      price: p.price,
      image: p.images[0] || '',
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft,
      tag,
      slug,
    };
  });

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-nordic">
            {t('listings.featuredTitle')}
          </h2>
          <p className="text-nordic-muted mt-1 text-sm">
            {t('listings.featuredSub')}
          </p>
        </div>
        <Link
          href="#"
          className="hidden sm:flex items-center gap-1 text-sm font-medium text-mosque hover:opacity-70 transition-opacity"
        >
          {t('listings.viewAll')}{' '}
          <span className="material-icons text-sm font-material-icons">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedCollection;
