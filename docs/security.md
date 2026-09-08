# Security Requirements

## Smart Agricultural Procurement Centre Management System

This document outlines the security architecture, requirements, and practices.

---

## 1. Authentication

### Supabase Auth + Mobile OTP
- **Primary authentication**: Mobile phone OTP via Twilio Verify
- Users register and login using their Indian mobile number (+91XXXXXXXXXX)
- Supabase Auth manages sessions, tokens, and refresh flows
- Session tokens are stored in HTTP-only cookies (via `@supabase/ssr`)

### Session Management
- Sessions are refreshed automatically via Next.js middleware on every request
- Expired sessions redirect users to the login flow
- No session data is stored in `localStorage` or client-accessible storage

---

## 2. Authorization — Identity Root

### `auth.uid()` as the Single Source of Identity

All authorization decisions are rooted in `auth.uid()`, the UUID of the
currently authenticated Supabase user. This value:

- Is cryptographically verified from the JWT by Supabase
- Cannot be spoofed by the client
- Is the only trusted identity signal in the system

### Role Resolution Chain

```
auth.uid()
    → profiles.id (1:1 with auth.users)
        → profiles.role (FARMER / OPERATOR / ADMIN)
            → farmers.profile_id   (if FARMER)
            → operators.profile_id (if OPERATOR) → operators.centre_id
            → admins.profile_id    (if ADMIN)
```

**The role is NEVER read from the client.** It is always derived from
`profiles.role` via the database, using `SECURITY DEFINER` helper functions.

---

## 3. Row Level Security (RLS) Architecture

### Overview

All 11 application tables have RLS **enabled**. A total of **48 policies** enforce
least-privilege access across 3 roles (FARMER, OPERATOR, ADMIN). No policies exist
for the `anon` role — unauthenticated users have zero data access.

### Helper Functions (SECURITY DEFINER)

Three narrowly-scoped `SECURITY DEFINER` functions bypass RLS to resolve
authorization data without causing recursive policy evaluation:

| Function | Returns | Purpose |
|----------|---------|---------|
| `get_user_role()` | `user_role` | Resolves the authenticated user's role from `profiles`. Prevents recursion when `profiles` policies reference the user's role. |
| `get_my_farmer_id()` | `UUID` | Resolves the `farmers.id` for the authenticated user. Used in booking/payment ownership checks. |
| `get_operator_centre_id()` | `UUID` | Resolves the `centre_id` for the authenticated operator. Only returns for active operators. |

**Why SECURITY DEFINER?**
- These functions query tables that themselves have RLS enabled
- Without SECURITY DEFINER, a policy on `profiles` that queries `profiles` would recurse infinitely
- Each function returns only a single scalar value for the current user
- `search_path` is locked to `public` to prevent search-path hijacking
- Execute permission is granted only to `authenticated` and revoked from `anon`

### Policy Categories

| Category | Count | Tables |
|----------|-------|--------|
| Farmer ownership (own data only) | 12 | profiles, farmers, bookings, queue_entries, procurements, payments, notifications |
| Operator centre-scoping | 14 | profiles, farmers, bookings, slots, queue_entries, procurements, payments |
| Admin full access | 18 | All tables |
| Public read (active records) | 2 | centres, slots |
| Self-registration | 2 | profiles, farmers |

### No DELETE Policies

No DELETE policies exist on any table. This is a deliberate security decision:
- Operational records (bookings, procurements, payments) use status transitions (e.g., CANCELLED)
- User records are soft-deleted via `is_active = false`
- Profile deletion cascades from `auth.users` (Supabase manages this)
- This prevents accidental or malicious data destruction through the API

---

## 4. Farmer Ownership Enforcement

A farmer's access is scoped through ownership chains:

```
auth.uid()
    → profiles.id = auth.uid()           (own profile)
    → farmers.profile_id = auth.uid()    (own farmer record)
    → bookings.farmer_id = get_my_farmer_id()   (own bookings)
    → queue_entries.booking_id ∈ own bookings    (own queue entries)
    → procurements.booking_id ∈ own bookings     (own procurements)
    → payments.farmer_id = get_my_farmer_id()    (own payments)
    → notifications.profile_id = auth.uid()      (own notifications)
```

### What Farmers CANNOT Do (enforced by RLS)
- Read another farmer's profile, bookings, payments, or procurement data
- Change their own `role` field (WITH CHECK enforces `role` immutability)
- Create or modify procurement records
- Create or modify payment records
- Modify queue position or status
- Insert a booking with a `farmer_id` that doesn't belong to them
- Access operator or admin records

---

## 5. Operator Centre Scoping

An operator's access is scoped to their assigned centre:

```
auth.uid()
    → operators.profile_id = auth.uid()
    → operators.centre_id (trusted centre assignment)
    → bookings WHERE centre_id = operator's centre
    → queue_entries WHERE centre_id = operator's centre
    → procurements WHERE centre_id = operator's centre
    → payments WHERE procurement.centre_id = operator's centre
```

### What Operators CANNOT Do (enforced by RLS)
- Access bookings, queue entries, procurements, or payments at other centres
- Change their own `centre_id` (WITH CHECK enforces immutability)
- Change their own `role`
- Create or modify centres
- Create or manage operators or admins
- Create bookings (only farmers can)

### Centre Scoping via `get_operator_centre_id()`
- Returns the `centre_id` from the `operators` table for the current user
- Only returns for operators with `is_active = true`
- Deactivated operators get `NULL`, effectively revoking all centre-scoped access

---

## 6. Admin Authorization

Admin access is verified through `get_user_role() = 'ADMIN'`, which:
- Queries `profiles.role` via a SECURITY DEFINER function
- Cannot be spoofed — the role value is in the database, not the client
- Grants broad read/write access across all tables

### Admin Caveats
- Admin policies use `USING (get_user_role() = 'ADMIN')` — role is always re-checked
- Some WITH CHECK clauses use `(true)` for admin UPDATE policies — this is safe because the USING clause already verified the admin role
- Jurisdiction scoping (STATE/DISTRICT/TALUK) is an application-layer concern, not enforced at the RLS level (a future enhancement)

---

## 7. Service Role Considerations

The Supabase **service role key** bypasses ALL RLS policies. It must be:

- Used **only** in trusted server-side code (Next.js Server Actions, API Route Handlers)
- **NEVER** exposed via `NEXT_PUBLIC_` environment variables
- **NEVER** sent to the browser
- Used for operations that legitimately need to bypass RLS, such as:
  - Creating the first admin user (bootstrapping)
  - System-generated notifications
  - Background jobs (slot generation, payment processing)
  - Data migrations

---

## 8. Secret Management

### Environment Variables

| Variable | Exposure | Location |
|----------|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-safe | `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe (RLS-protected) | `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | `.env.local` |
| `TWILIO_ACCOUNT_SID` | **Server-only** | `.env.local` |
| `TWILIO_AUTH_TOKEN` | **Server-only** | `.env.local` |
| `TWILIO_VERIFY_SERVICE_SID` | **Server-only** | `.env.local` |

### Rules

1. **Never prefix server-only secrets with `NEXT_PUBLIC_`**.
2. **Twilio credentials are NEVER sent to the client**.
3. **The Supabase service role key bypasses RLS** — server-only, never client-side.
4. **`.env.local` is in `.gitignore`** and never committed.
5. **`.env.example`** contains placeholder values for onboarding.

---

## 9. Sensitive Farmer Information

### Aadhaar Number
- **Never stored as plaintext** in the database
- Stored as a one-way SHA-256 hash (`aadhaar_number_hash`)
- Used only for deduplication — original value is never stored
- Hashed server-side immediately, then discarded

### Bank Account Number
- **Stored encrypted** using AES-256 (`bank_account_number_encrypted`)
- Encryption/decryption happen **only on the server side**
- Encryption key stored as an environment variable
- Decrypted only when processing payments

### Phone Number
- Stored in `profiles` table, protected by RLS
- A farmer can only see their own phone number
- Operators see farmer profiles only for farmers with bookings at their centre

---

## 10. Input Validation

### Validation Layers
1. **Client-side (Zod)**: Immediate user feedback — not a security boundary
2. **Server-side (Zod)**: Authoritative validation before database operations
3. **Database-level**: PostgreSQL constraints (NOT NULL, UNIQUE, CHECK, FK, enums)

### Specific Validations
| Field | Validation |
|-------|-----------|
| Phone number | Indian mobile format: `+91` followed by 10 digits |
| Pincode | 6-digit Indian postal code |
| Aadhaar | 12-digit number (validated before hashing) |
| IFSC code | Standard Indian bank IFSC format |
| Quantities | Positive numbers, reasonable maximums |
| Dates | Cannot book in the past |
| Slot times | Must be within centre operating hours |

---

## 11. Protection Against Unauthorized Cross-User Access

### Threat: Farmer A accessing Farmer B's data

**Mitigations**:
1. RLS policies filter all queries by `auth.uid()` via ownership chains
2. `get_my_farmer_id()` ensures farmer_id is derived from the session, not client input
3. UUIDs are non-sequential — guessing is infeasible
4. Token numbers are not sufficient for authentication

### Threat: Operator accessing another centre's data

**Mitigations**:
1. `get_operator_centre_id()` returns only the operator's assigned centre
2. All operator policies use `centre_id = get_operator_centre_id()`
3. WITH CHECK prevents operators from writing data to other centres
4. Deactivated operators get `NULL` from the function, revoking access

### Threat: Role escalation

**Mitigations**:
1. Roles stored in `profiles` table, set only during registration or by admins
2. `profiles_update_own` WITH CHECK enforces `role` immutability for self-updates
3. `operators_update_own` WITH CHECK enforces `centre_id` immutability
4. Role is always derived from `get_user_role()`, never from client input

### Threat: Unauthenticated access

**Mitigations**:
1. No policies exist for the `anon` role — zero data access for unauthenticated users
2. Helper functions have `REVOKE EXECUTE` from `anon`
3. All policies specify `TO authenticated`

---

## 12. Known Limitations

1. **Admin jurisdiction scoping**: Admin RLS policies currently grant full access to all admins. Jurisdiction-level filtering (STATE/DISTRICT/TALUK) is an application-layer concern. A future RLS enhancement could scope admin access using `admins.jurisdiction_level` and `admins.jurisdiction_value`.

2. **Booking status transition enforcement**: RLS permits farmers to update their own bookings (for cancellation) but does not enforce which status transitions are valid (e.g., preventing COMPLETED → PENDING). This is an application-layer concern enforced in server-side service functions.

3. **Column-level restrictions**: PostgreSQL RLS operates at the row level, not column level. Preventing a farmer from updating specific columns (e.g., `status` on procurements) is achieved by not granting them any UPDATE policy on that table, rather than column-specific restrictions.

4. **Performance**: Subqueries in RLS policies (e.g., `booking_id IN (SELECT ...)`) may have performance implications at scale. The `SECURITY DEFINER` functions are `STABLE` and can be cached within a transaction, but monitoring is recommended.

5. **First admin bootstrapping**: The very first admin user must be created using the service role key, since there is no existing admin to create another via RLS.

---

## 13. Future Production Security Considerations

- **Audit logging**: Implement a database-level audit log (e.g., `pgaudit` extension or a trigger-based audit table) to track who accessed/modified what data
- **Rate limiting**: Add rate limiting at the application layer for booking creation, OTP requests, and API calls
- **CSP headers**: Configure Content-Security-Policy headers in Next.js
- **WAF**: Consider a Web Application Firewall for production deployments
- **Encryption at rest**: Ensure the Supabase project has encryption at rest enabled
- **Backup and recovery**: Regular automated backups with tested recovery procedures
- **Penetration testing**: Conduct security testing before production launch

---

## 14. API Security

### CSRF Protection
- Next.js Server Actions have built-in CSRF protection
- API routes should validate the `Origin` header

### SQL Injection Prevention
- All queries use Supabase client's parameterized queries
- No raw SQL string concatenation in application code

### XSS Prevention
- React's default escaping handles most XSS vectors
- Content Security Policy headers should be configured
