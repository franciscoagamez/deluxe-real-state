import { Property } from '@/types/property';

export function mapDatabaseProperty(p: any): Property {
  if (!p) return {} as Property;
  return {
    id: p.id,
    title: p.title || '',
    location: p.location || '',
    // Price is stored in cents in Supabase, convert to dollars
    price: typeof p.price === 'number' ? p.price / 100 : 0,
    image: p.image_url || p.image || '',
    beds: Number(p.beds) || 0,
    baths: Number(p.baths) || 0,
    sqft: Number(p.area) || 0,
    type: p.listing_type === 'for_rent' ? 'rent' : 'sale',
    is_new: p.tag === 'New Arrival' || p.is_new || false,
    created_at: p.created_at || '',
    is_featured: p.is_featured || false,
    slug: p.slug || '',
    images: p.images && p.images.length > 0 ? p.images : [p.image_url || p.image || ''],
    latitude: p.latitude ? Number(p.latitude) : undefined,
    longitude: p.longitude ? Number(p.longitude) : undefined,
    description: p.description || '',
  };
}
