import { z } from 'zod';

export const phoneSchema = z.string().transform((val) => {
  const cleaned = val.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  return `+${cleaned}`;
}).pipe(
  z.string().regex(/^\+91\d{10}$/, "Must be a valid 10-digit Indian mobile number")
);

export const otpSchema = z.string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");

export const farmerRegistrationSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  district: z.string().min(2, "District must be at least 2 characters").max(100),
  state: z.string().min(2, "State must be at least 2 characters").max(100).default('Karnataka'),
});
