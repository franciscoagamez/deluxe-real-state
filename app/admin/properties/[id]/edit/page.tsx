import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PropertyForm from '@/components/admin/PropertyForm';
import type { PropertyRow } from '@/types/property';

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single<PropertyRow>();

  if (!property) {
    notFound();
  }

  return <PropertyForm mode="edit" propertyId={property.id} initialData={property} />;
}
