export type PropertyType = 'sale' | 'rent';

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  beds: number;
  baths: number;
  sqft: number;
  type: PropertyType;
  is_new: boolean;
  created_at: string;
  is_featured?: boolean;
  slug?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}

// --- Admin create/edit form types -----------------------------------------
// These mirror the `properties` table columns directly (unlike `Property`
// above, which is a normalized shape for the public-facing site).

export type Currency = 'usd' | 'eur';
export type ListingTypeEnum = 'for_sale' | 'for_rent';
export type PropertyTypeEnum =
  | 'house'
  | 'apartment'
  | 'villa'
  | 'penthouse'
  | 'condo'
  | 'townhouse'
  | 'cabin'
  | 'farmhouse';
export type PropertyStatus = 'active' | 'pending' | 'sold' | 'inactive';

export interface PropertyRow {
  id: string;
  title: string;
  description: string | null;
  location: string;
  price: number; // cents
  currency: Currency;
  listing_type: ListingTypeEnum;
  property_type: PropertyTypeEnum;
  tag: string | null;
  beds: number;
  baths: number;
  area: number;
  image_url: string;
  image_alt: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  slug: string | null;
  images: string[] | null;
  latitude: number | null;
  longitude: number | null;
  parking: number;
  year_built: number | null;
  amenities: string[];
  status: PropertyStatus;
}

