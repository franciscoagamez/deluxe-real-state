import { Profile } from '@/types/profile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseProfile(p: any): Profile {
  return {
    id: p.id,
    email: p.email ?? null,
    full_name: p.full_name ?? null,
    avatar_url: p.avatar_url ?? null,
    role: p.role === 'admin' ? 'admin' : 'user',
    created_at: p.created_at ?? '',
    updated_at: p.updated_at ?? '',
  };
}
