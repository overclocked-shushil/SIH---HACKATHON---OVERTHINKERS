'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, farmerRegistrationSchema } from '@/lib/validations/auth';

/**
 * Sends an OTP via Supabase Auth (which must be configured with Twilio Verify in the Dashboard).
 */
export async function sendOtpAction(phoneInput: string) {
  const parseResult = phoneSchema.safeParse(phoneInput);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  const supabase = await createClient();
  const phone = parseResult.data;

  // Supabase Auth manages Twilio integration internally
  // The server-side Twilio credentials are securely configured in the Supabase Dashboard
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    console.error('sendOtp error:', error.message);
    if (error.status === 429) {
      return { error: "Too many requests. Please try again later." };
    }
    return { error: "Failed to send OTP. Please verify your number." };
  }

  return { success: true, phone };
}

/**
 * Verifies the OTP. If successful, Supabase establishes a session cookie automatically.
 */
export async function verifyOtpAction(phoneInput: string, otpInput: string) {
  const phoneResult = phoneSchema.safeParse(phoneInput);
  const otpResult = otpSchema.safeParse(otpInput);

  if (!phoneResult.success) return { error: phoneResult.error.issues[0].message };
  if (!otpResult.success) return { error: otpResult.error.issues[0].message };

  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneResult.data,
    token: otpResult.data,
    type: 'sms',
  });

  if (error || !data.user) {
    return { error: "Invalid or expired OTP." };
  }

  // Check if the user already has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    // New user -> needs to complete registration
    return { success: true, isNewUser: true };
  }

  return { success: true, isNewUser: false, role: profile.role };
}

/**
 * Completes farmer registration by creating records in 'profiles' and 'farmers'.
 * Enforces the 'FARMER' role and uses the authenticated user's session, respecting RLS.
 */
export async function registerFarmerAction(formData: { full_name: string; district: string; state?: string }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "You must verify your phone number first." };
  }

  const parseResult = farmerRegistrationSchema.safeParse(formData);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  // Check if profile already exists to prevent duplication
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    return { error: "Your profile is already registered." };
  }

  // 1. Insert Profile
  // RLS policy `profiles_insert_own` permits inserting a profile where id = auth.uid()
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    role: 'FARMER', // Hardcoded enforcement. Admin/Operator provisioned separately.
    full_name: parseResult.data.full_name,
    phone: user.phone!,
    is_active: true,
  });

  if (profileError) {
    console.error('Failed to insert profile:', profileError.message);
    return { error: "Failed to create profile. Please try again." };
  }

  // 2. Insert Farmer record
  // RLS policy `farmers_insert_own` permits this since get_user_role() is now 'FARMER'
  const { error: farmerError } = await supabase.from('farmers').insert({
    profile_id: user.id,
    district: parseResult.data.district,
    state: parseResult.data.state || 'Karnataka',
  });

  if (farmerError) {
    console.error('Failed to insert farmer details:', farmerError.message);
    return { error: "Failed to save farmer details." };
  }

  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
