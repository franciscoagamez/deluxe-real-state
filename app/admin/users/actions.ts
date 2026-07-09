'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/types/profile';

interface UpdateUserRoleResult {
  success: boolean;
  error?: string;
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<UpdateUserRoleResult> {
  if (newRole !== 'user' && newRole !== 'admin') {
    return { success: false, error: 'Invalid role.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated.' };
  }

  if (user.id === userId) {
    return { success: false, error: 'You cannot change your own role.' };
  }

  // NOTE: `user.role` is the Postgres/Supabase-internal role (always
  // "authenticated"), NOT our app-level role -- must check `profiles` instead.
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'admin') {
    return { success: false, error: 'Forbidden.' };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}
