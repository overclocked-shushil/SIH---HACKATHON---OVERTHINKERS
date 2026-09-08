# Roles & Permissions

## Smart Agricultural Procurement Centre Management System

This document defines the permission model for the three user roles:
**FARMER**, **OPERATOR**, and **ADMIN**, and documents the concrete RLS
policies that enforce them at the database level.

---

## Role Summary

| Capability | FARMER | OPERATOR | ADMIN |
|------------|:------:|:--------:|:-----:|
| Register / login via OTP | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| **Centres** | | | |
| View active centres | ✅ (list) | ✅ (assigned) | ✅ (all) |
| Create / edit / deactivate centres | ❌ | ❌ | ✅ |
| Configure centre capacity / hours | ❌ | ❌ | ✅ |
| **Slots** | | | |
| View available slots | ✅ (active only) | ✅ (assigned centre) | ✅ (all) |
| Create / manage slots | ❌ | ❌ | ✅ |
| **Bookings** | | | |
| Create a booking | ✅ (own) | ❌ | ❌ |
| View bookings | ✅ (own only) | ✅ (assigned centre) | ✅ (all) |
| Cancel a booking | ✅ (own, if PENDING/CONFIRMED) | ✅ (assigned centre) | ✅ |
| Check in a farmer | ❌ | ✅ (assigned centre) | ✅ |
| **Queue** | | | |
| View queue position | ✅ (own entry) | ✅ (assigned centre) | ✅ (all) |
| Manage queue (call next, skip, reorder) | ❌ | ✅ (assigned centre) | ✅ |
| **Procurement** | | | |
| View procurement status | ✅ (own) | ✅ (assigned centre) | ✅ (all) |
| Record quality / weighing / pricing | ❌ | ✅ (assigned centre) | ✅ |
| Accept / reject procurement | ❌ | ✅ (assigned centre) | ✅ |
| **Payments** | | | |
| View payment status | ✅ (own) | ✅ (assigned centre) | ✅ (all) |
| Record / process payments | ❌ | ✅ (assigned centre) | ✅ |
| **Notifications** | | | |
| Receive notifications | ✅ (own) | ✅ (own) | ✅ (own) |
| Mark own as read | ✅ | ✅ | ✅ |
| Send notifications | ❌ | ❌ | ✅ |
| **Operators** | | | |
| View operators | ❌ | Own record only | ✅ |
| Create / manage operators | ❌ | ❌ | ✅ |
| **Admins** | | | |
| View admins | ❌ | ❌ | ✅ |
| Create / manage admins | ❌ | ❌ | ✅ |

---

## Table-by-Table RLS Policy Audit

### profiles

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Own (id = auth.uid()) | Own + farmer profiles at assigned centre | All | ❌ |
| INSERT | Own (id = auth.uid()) | Own (id = auth.uid()) | Own (id = auth.uid()) | ❌ |
| UPDATE | Own (cannot change role) | Own (cannot change role) | Any | ❌ |
| DELETE | ❌ (cascade from auth.users) | ❌ | ❌ | ❌ |

**Policies**: `profiles_select_own`, `profiles_select_admin`, `profiles_select_operator`, `profiles_insert_own`, `profiles_update_own`, `profiles_update_admin`

---

### farmers

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Own (profile_id = auth.uid()) | Farmers with bookings at assigned centre | All | ❌ |
| INSERT | Own (profile_id = auth.uid(), role=FARMER) | ❌ | Any | ❌ |
| UPDATE | Own (cannot change profile_id) | ❌ | Any | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ |

**Policies**: `farmers_select_own`, `farmers_select_operator`, `farmers_select_admin`, `farmers_insert_own`, `farmers_insert_admin`, `farmers_update_own`, `farmers_update_admin`

---

### centres

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Active centres (is_active=true) | Active centres | All (including inactive) | ❌ |
| INSERT | ❌ | ❌ | ✅ | ❌ |
| UPDATE | ❌ | ❌ | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ (use is_active) | ❌ |

**Policies**: `centres_select_active`, `centres_select_admin`, `centres_insert_admin`, `centres_update_admin`

---

### operators

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | ❌ | Own record | All | ❌ |
| INSERT | ❌ | ❌ | ✅ | ❌ |
| UPDATE | ❌ | Own (cannot change centre_id) | Any | ❌ |
| DELETE | ❌ | ❌ | ❌ (use is_active) | ❌ |

**Policies**: `operators_select_own`, `operators_select_admin`, `operators_insert_admin`, `operators_update_own`, `operators_update_admin`

---

### admins

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | ❌ | ❌ | Own + all admin records | ❌ |
| INSERT | ❌ | ❌ | ✅ | ❌ |
| UPDATE | ❌ | ❌ | Own record | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ |

**Policies**: `admins_select_own`, `admins_select_admin`, `admins_insert_admin`, `admins_update_own`

---

### slots

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Active slots (is_active=true) | All at assigned centre | All | ❌ |
| INSERT | ❌ | ❌ | ✅ | ❌ |
| UPDATE | ❌ | At assigned centre | Any | ❌ |
| DELETE | ❌ | ❌ | ❌ (use is_active) | ❌ |

**Policies**: `slots_select_active`, `slots_select_operator`, `slots_select_admin`, `slots_insert_admin`, `slots_update_admin`, `slots_update_operator`

---

### bookings

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Own (farmer_id matches) | At assigned centre | All | ❌ |
| INSERT | Own (farmer_id must match auth.uid()) | ❌ | ❌ | ❌ |
| UPDATE | Own | At assigned centre | Any | ❌ |
| DELETE | ❌ (use CANCELLED status) | ❌ | ❌ | ❌ |

**Policies**: `bookings_select_farmer`, `bookings_select_operator`, `bookings_select_admin`, `bookings_insert_farmer`, `bookings_update_farmer`, `bookings_update_operator`, `bookings_update_admin`

---

### queue_entries

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Own (via booking ownership) | At assigned centre | All | ❌ |
| INSERT | ❌ | At assigned centre | Any | ❌ |
| UPDATE | ❌ | At assigned centre | Any | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ |

**Policies**: `queue_select_farmer`, `queue_select_operator`, `queue_select_admin`, `queue_insert_operator`, `queue_insert_admin`, `queue_update_operator`, `queue_update_admin`

---

### procurements

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Own (via booking ownership) | At assigned centre | All | ❌ |
| INSERT | ❌ | At assigned centre | Any | ❌ |
| UPDATE | ❌ | At assigned centre | Any | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ |

**Policies**: `procurements_select_farmer`, `procurements_select_operator`, `procurements_select_admin`, `procurements_insert_operator`, `procurements_insert_admin`, `procurements_update_operator`, `procurements_update_admin`

---

### payments

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Own (farmer_id matches) | At assigned centre (via procurement) | All | ❌ |
| INSERT | ❌ | At assigned centre (via procurement) | Any | ❌ |
| UPDATE | ❌ | At assigned centre (via procurement) | Any | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ |

**Policies**: `payments_select_farmer`, `payments_select_operator`, `payments_select_admin`, `payments_insert_operator`, `payments_insert_admin`, `payments_update_operator`, `payments_update_admin`

---

### notifications

| Operation | FARMER | OPERATOR | ADMIN | ANON |
|-----------|--------|----------|-------|------|
| SELECT | Own (profile_id = auth.uid()) | Own | Own + all | ❌ |
| INSERT | ❌ | ❌ | ✅ | ❌ |
| UPDATE | Own (mark as read) | Own (mark as read) | Any | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ |

**Policies**: `notifications_select_own`, `notifications_insert_admin`, `notifications_update_own`, `notifications_update_admin`

---

## FARMER Role — Detailed

### Scope
A farmer can **only access their own data**. They cannot see other farmers'
bookings, queue positions, procurement results, or payment information.

### Permissions
- **Authentication**: Register and login using mobile OTP
- **Profile**: View and edit own profile (name, phone, village, bank details) — **cannot change role**
- **Centres**: Browse active procurement centres (read-only list)
- **Slots**: View active slots at a selected centre
- **Bookings**: Create, view, and cancel own bookings
- **Queue**: View own queue position and estimated wait time (real-time)
- **Procurement**: View own procurement status (quality, weight, price) — **read-only**
- **Payments**: View own payment status — **read-only**
- **Notifications**: Receive, read, and mark as read own notifications

### Restrictions
- Cannot access any other farmer's data
- Cannot modify centre, operator, or admin data
- Cannot create or modify procurement records
- Cannot create or modify payment records
- Cannot modify queue position or status
- Cannot change own role
- Cannot cancel bookings that are already `CHECKED_IN` or beyond (enforced at application layer)
- Cannot create bookings for past dates (enforced at application layer)

---

## OPERATOR Role — Detailed

### Scope
An operator can **only access data for their assigned centre**. They cannot
see data from other centres, and they cannot modify system-wide settings.

### Permissions
- **Authentication**: Login using mobile OTP
- **Profile**: View and edit own profile — **cannot change role**
- **Centre**: View details of their assigned centre (read-only)
- **Bookings**: View all bookings for their assigned centre
- **Check-in**: Check in farmers who arrive at the centre (status → CHECKED_IN)
- **Queue Management**: View, create, and update queue entries at their centre
- **Procurement**: Create and update procurement records at their centre
- **Payments**: Create and update payment records at their centre (via procurement)
- **Notifications**: View and mark as read own notifications

### Restrictions
- Cannot access data from any centre other than their assigned centre
- Cannot create or modify centres
- Cannot create or manage other operators
- Cannot create bookings (farmers do this themselves)
- Cannot access admin records
- Cannot modify another operator's data
- Cannot change own centre assignment
- Cannot change own role

---

## ADMIN Role — Detailed

### Scope
An admin has **broad management permissions**, with role verified via
`auth.uid()` → `profiles.role`.

### Permissions
- **Authentication**: Login using mobile OTP or email
- **Profile**: View and edit any profile, including role changes
- **Centres**: Full CRUD — create, read, update, deactivate centres
- **Centre Configuration**: Set capacity, operating hours, slot duration
- **Operators**: Create, assign, reassign, and deactivate operators
- **Admins**: Create and manage admin records
- **Slots**: Generate, modify, and deactivate slot schedules
- **Bookings**: View and update all bookings across all centres
- **Queue**: View and update queue status across all centres
- **Procurement**: View and update all procurement records
- **Payments**: View and update all payment records
- **Notifications**: Create, view, and update all notifications

### Restrictions
- Admin role is verified via `get_user_role()` from the database, not client input
- Cannot impersonate farmers or operators
- All admin actions should be logged for audit (application-layer concern)

---

## Authorization Enforcement

### Layer 1: Database (Row Level Security)
- Supabase RLS policies enforce data access at the database level
- 48 explicit policies across 11 tables
- 3 `SECURITY DEFINER` helper functions for safe role/ownership resolution
- Even if application code has a bug, the database will reject unauthorized queries

### Layer 2: Server-Side Middleware
- Next.js middleware and server actions verify the user's session and role
- Role checks happen **server-side only** — never trust client-supplied role claims
- API routes verify that the requesting user has the required role before processing

### Layer 3: Application Logic
- Business rules (e.g., "a farmer can only cancel PENDING/CONFIRMED bookings") are
  enforced in server-side service functions
- Operator actions are scoped to their `centre_id` from the `operators` table
- Admin jurisdiction scoping is applied as additional WHERE clauses

### Important Principles
1. **Never trust client-side role claims** — always derive the role from the database
2. **Defence in depth** — authorization is checked at every layer
3. **Principle of least privilege** — users can only access what they need
4. **Data isolation** — farmers cannot see each other's data; operators cannot see other centres
5. **No DELETE policies** — operational records use status transitions, not deletion
