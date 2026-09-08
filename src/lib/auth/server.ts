import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { redirect } from 'next/navigation';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Enums']['user_role'];

/**
 * Returns the currently authenticated Supabase Auth user.
 * Does not check if the user has completed profile registration.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Returns the user's application profile.
 * Returns null if the user is not authenticated or hasn't created a profile yet.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;
  return profile;
}

/**
 * Requires an authenticated user. Redirects to /auth if none exists.
 */
export async function requireAuthenticatedUser(redirectTo = '/auth'): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Requires a specific role or set of roles.
 * Redirects to /auth (or unauthorized page) if profile doesn't match.
 */
export async function requireRole(allowedRoles: UserRole[], redirectTo = '/auth'): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(redirectTo);
  }
  
  if (!allowedRoles.includes(profile.role)) {
    // Alternatively, redirect to an explicitly unauthorized page
    redirect('/unauthorized');
  }
  
  return profile;
}
