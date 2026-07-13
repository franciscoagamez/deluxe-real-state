'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'property-images';

export interface PropertyFormState {
  error?: string;
}

interface UploadResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

// NOTE: `user.role` is the Postgres/Supabase-internal role (always
// "authenticated"), NOT our app-level role -- must check `profiles` instead.
async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return callerProfile?.role === 'admin' ? user : null;
}

async function generateUniqueSlug(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  title: string,
  excludeId?: string,
): Promise<string> {
  const { data: slugData } = await supabaseAdmin.rpc('slugify', { value: title });
  const fallback = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const base = (typeof slugData === 'string' && slugData) || fallback || 'property';

  let candidate = base;
  let suffix = 2;
  for (;;) {
    let query = supabaseAdmin.from('properties').select('id').eq('slug', candidate).limit(1);
    if (excludeId) query = query.neq('id', excludeId);
    const { data: existing } = await query;
    if (!existing || existing.length === 0) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function parsePropertyPayload(formData: FormData) {
  const images = formData.getAll('images').map(String).filter(Boolean);
  const amenities = formData.getAll('amenities').map(String);
  const yearBuiltRaw = String(formData.get('year_built') ?? '');
  const latitudeRaw = String(formData.get('latitude') ?? '');
  const longitudeRaw = String(formData.get('longitude') ?? '');

  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    location: String(formData.get('location') ?? '').trim(),
    price: Math.round(Number(formData.get('price') ?? 0) * 100),
    currency: String(formData.get('currency') ?? 'usd'),
    listing_type: String(formData.get('listing_type') ?? 'for_sale'),
    property_type: String(formData.get('property_type') ?? 'house'),
    status: String(formData.get('status') ?? 'active'),
    tag: String(formData.get('tag') ?? '').trim() || null,
    beds: Number(formData.get('beds') ?? 0),
    baths: Number(formData.get('baths') ?? 0),
    area: Number(formData.get('area') ?? 0),
    parking: Number(formData.get('parking') ?? 0),
    year_built: yearBuiltRaw ? Number(yearBuiltRaw) : null,
    image_url: images[0] ?? '',
    image_alt: String(formData.get('image_alt') ?? '').trim() || null,
    images,
    is_featured: formData.get('is_featured') === 'on',
    latitude: latitudeRaw ? Number(latitudeRaw) : null,
    longitude: longitudeRaw ? Number(longitudeRaw) : null,
    amenities,
  };
}

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await getAdminUser();
  if (!user) return { error: 'Forbidden.' };

  const payload = parsePropertyPayload(formData);
  if (!payload.title || !payload.location || !payload.image_url) {
    return { error: 'Please fill in all required fields, including at least one photo.' };
  }

  const supabaseAdmin = createAdminClient();
  const slug = await generateUniqueSlug(supabaseAdmin, payload.title);

  const { error } = await supabaseAdmin.from('properties').insert({ ...payload, slug });
  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/properties');
  redirect('/admin/properties');
}

export async function updateProperty(
  propertyId: string,
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await getAdminUser();
  if (!user) return { error: 'Forbidden.' };

  const payload = parsePropertyPayload(formData);
  if (!payload.title || !payload.location || !payload.image_url) {
    return { error: 'Please fill in all required fields, including at least one photo.' };
  }

  const supabaseAdmin = createAdminClient();
  const { data: existing } = await supabaseAdmin
    .from('properties')
    .select('slug, title')
    .eq('id', propertyId)
    .single();

  const slug =
    existing?.slug && existing.title === payload.title
      ? existing.slug
      : await generateUniqueSlug(supabaseAdmin, payload.title, propertyId);

  const { error } = await supabaseAdmin
    .from('properties')
    .update({ ...payload, slug })
    .eq('id', propertyId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/properties');
  revalidatePath(`/properties/${slug}`);
  redirect('/admin/properties');
}

export async function deleteProperty(propertyId: string): Promise<DeleteResult> {
  const user = await getAdminUser();
  if (!user) return { success: false, error: 'Forbidden.' };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from('properties').delete().eq('id', propertyId);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/properties');
  return { success: true };
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadPropertyImages(formData: FormData): Promise<UploadResult> {
  const user = await getAdminUser();
  if (!user) return { success: false, error: 'Forbidden.' };

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { success: false, error: 'No files provided.' };

  const supabaseAdmin = createAdminClient();
  const urls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { success: false, error: `"${file.name}" exceeds the 5MB limit.` };
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'image/jpeg',
    });
    if (error) {
      return { success: false, error: error.message };
    }
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { success: true, urls };
}

export async function deletePropertyImage(url: string): Promise<DeleteResult> {
  const user = await getAdminUser();
  if (!user) return { success: false, error: 'Forbidden.' };

  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return { success: true };

  const supabaseAdmin = createAdminClient();
  const path = url.substring(idx + marker.length);
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
