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

