-- ============================================================================
-- RLS Verification Test Procedures
-- ============================================================================
-- These are reproducible SQL test procedures designed to be run against a
-- Supabase instance after applying migrations 001 and 002.
--
-- PREREQUISITES:
--   1. Apply 001_initial_schema.sql and 002_rls_policies.sql
--   2. Create test auth.users and profiles as described below
--   3. Run each test block using the Supabase SQL Editor or psql
--
-- NOTE: These tests use SET LOCAL ROLE and auth.uid() simulation which
-- requires the Supabase local development environment or direct database
-- access. They CANNOT be verified via static inspection alone.
--
-- To simulate auth.uid() in Supabase SQL Editor, use:
--   SET LOCAL request.jwt.claims = '{"sub": "<user-uuid>"}';
--   SET LOCAL ROLE authenticated;
-- ============================================================================

-- ============================================================================
-- TEST SETUP: Create test data (run as service_role / superuser)
-- ============================================================================

/*
-- Run this setup block as the postgres/service_role user BEFORE running tests.
-- This creates the test fixture data.

-- Step 1: Create auth users (in Supabase, this is done via auth.users table)
-- For local testing with supabase CLI:

INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'farmer_a@test.com', '{}', now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'farmer_b@test.com', '{}', now(), now()),
  ('a0000000-0000-0000-0000-000000000003', 'operator_a@test.com', '{}', now(), now()),
  ('a0000000-0000-0000-0000-000000000004', 'operator_b@test.com', '{}', now(), now()),
  ('a0000000-0000-0000-0000-000000000005', 'admin@test.com', '{}', now(), now()),
  ('a0000000-0000-0000-0000-000000000006', 'anon_user@test.com', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create profiles
INSERT INTO public.profiles (id, role, full_name, phone) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'FARMER',   'Farmer A',   '+919876543001'),
  ('a0000000-0000-0000-0000-000000000002', 'FARMER',   'Farmer B',   '+919876543002'),
  ('a0000000-0000-0000-0000-000000000003', 'OPERATOR', 'Operator A', '+919876543003'),
  ('a0000000-0000-0000-0000-000000000004', 'OPERATOR', 'Operator B', '+919876543004'),
  ('a0000000-0000-0000-0000-000000000005', 'ADMIN',    'Admin User', '+919876543005')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create centres
INSERT INTO public.centres (id, name, code, address, district) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Centre Alpha', 'KA-BLR-001', '123 Main St', 'Bangalore Urban'),
  ('c0000000-0000-0000-0000-000000000002', 'Centre Beta',  'KA-MYS-001', '456 Oak Ave', 'Mysore')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create farmers
INSERT INTO public.farmers (id, profile_id, district) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Bangalore Urban'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Mysore')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create operators (Operator A → Centre Alpha, Operator B → Centre Beta)
INSERT INTO public.operators (id, profile_id, centre_id) VALUES
  ('o0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001'),
  ('o0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create admin
INSERT INTO public.admins (id, profile_id, department) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Agriculture Dept')
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create slots
INSERT INTO public.slots (id, centre_id, date, start_time, end_time) VALUES
  ('s0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '09:00', '09:30'),
  ('s0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', CURRENT_DATE + 1, '09:00', '09:30')
ON CONFLICT (id) DO NOTHING;

-- Step 8: Create bookings
INSERT INTO public.bookings (id, token_number, farmer_id, centre_id, slot_id, booking_date, status) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'KA-BLR-001-TEST-001', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, 'CONFIRMED'),
  ('b0000000-0000-0000-0000-000000000002', 'KA-MYS-001-TEST-001', 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', CURRENT_DATE + 1, 'CONFIRMED')
ON CONFLICT (id) DO NOTHING;

-- Step 9: Create queue entries
INSERT INTO public.queue_entries (id, booking_id, centre_id, queue_date, position) VALUES
  ('q0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, 1),
  ('q0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', CURRENT_DATE + 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Step 10: Create procurements
INSERT INTO public.procurements (id, booking_id, centre_id, crop_name, status) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Rice', 'PENDING_QUALITY'),
  ('p0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Wheat', 'PENDING_QUALITY')
ON CONFLICT (id) DO NOTHING;

-- Step 11: Create payments
INSERT INTO public.payments (id, procurement_id, farmer_id, amount, status) VALUES
  ('y0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 5000.00, 'PENDING'),
  ('y0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 7500.00, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- Step 12: Create notifications
INSERT INTO public.notifications (id, profile_id, title, message) VALUES
  ('n0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Booking Confirmed', 'Your booking is confirmed.'),
  ('n0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Booking Confirmed', 'Your booking is confirmed.')
ON CONFLICT (id) DO NOTHING;

*/


-- ============================================================================
-- TEST 1: Farmer A cannot read Farmer B's profile
-- Expected: Returns 0 rows (only Farmer A's own profile)
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';
SET LOCAL ROLE authenticated;

-- Should return 1 row (Farmer A's profile only)
SELECT id, full_name FROM public.profiles WHERE id = 'a0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows

-- Should return 1 row (own profile)
SELECT id, full_name FROM public.profiles WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- Expected: 1 row (Farmer A)

RESET ROLE;
*/


-- ============================================================================
-- TEST 2: Farmer A cannot read Farmer B's booking
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';
SET LOCAL ROLE authenticated;

-- Should return 0 rows
SELECT id, token_number FROM public.bookings
WHERE farmer_id = 'f0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows

-- Should return 1 row (own booking)
SELECT id, token_number FROM public.bookings
WHERE farmer_id = 'f0000000-0000-0000-0000-000000000001';
-- Expected: 1 row

RESET ROLE;
*/


-- ============================================================================
-- TEST 3: Farmer A cannot read Farmer B's payment
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';
SET LOCAL ROLE authenticated;

SELECT id, amount FROM public.payments
WHERE farmer_id = 'f0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows

SELECT id, amount FROM public.payments
WHERE farmer_id = 'f0000000-0000-0000-0000-000000000001';
-- Expected: 1 row

RESET ROLE;
*/


-- ============================================================================
-- TEST 4: Farmer A cannot modify Farmer B's booking
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';
SET LOCAL ROLE authenticated;

UPDATE public.bookings SET status = 'CANCELLED'
WHERE id = 'b0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows affected (Farmer A's policy does not match Farmer B's booking)

RESET ROLE;
*/


-- ============================================================================
-- TEST 5: Farmer cannot modify procurement records
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';
SET LOCAL ROLE authenticated;

UPDATE public.procurements SET quality_grade = 'A'
WHERE id = 'p0000000-0000-0000-0000-000000000001';
-- Expected: Error or 0 rows (farmer has no UPDATE policy on procurements)

RESET ROLE;
*/


-- ============================================================================
-- TEST 6: Farmer cannot modify payment amount/status
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';
SET LOCAL ROLE authenticated;

UPDATE public.payments SET amount = 999999.00, status = 'COMPLETED'
WHERE id = 'y0000000-0000-0000-0000-000000000001';
-- Expected: Error or 0 rows (farmer has no UPDATE policy on payments)

RESET ROLE;
*/


-- ============================================================================
-- TEST 7: Farmer cannot change their role to ADMIN
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001"}';
SET LOCAL ROLE authenticated;

UPDATE public.profiles SET role = 'ADMIN'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- Expected: Error (WITH CHECK fails because role must match existing role)

RESET ROLE;
*/


-- ============================================================================
-- TEST 8: Operator at Centre A cannot read Centre B bookings
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000003"}';
SET LOCAL ROLE authenticated;

SELECT id, token_number FROM public.bookings
WHERE centre_id = 'c0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows (Operator A is assigned to Centre Alpha, not Centre Beta)

SELECT id, token_number FROM public.bookings
WHERE centre_id = 'c0000000-0000-0000-0000-000000000001';
-- Expected: 1 row (Operator A's centre)

RESET ROLE;
*/


-- ============================================================================
-- TEST 9: Operator at Centre A cannot modify Centre B queue entries
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000003"}';
SET LOCAL ROLE authenticated;

UPDATE public.queue_entries SET status = 'CALLED'
WHERE id = 'q0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows affected (queue entry belongs to Centre Beta)

UPDATE public.queue_entries SET status = 'CALLED'
WHERE id = 'q0000000-0000-0000-0000-000000000001';
-- Expected: 1 row affected (queue entry belongs to Centre Alpha)

RESET ROLE;
*/


-- ============================================================================
-- TEST 10: Operator cannot change their own centre assignment
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000003"}';
SET LOCAL ROLE authenticated;

UPDATE public.operators SET centre_id = 'c0000000-0000-0000-0000-000000000002'
WHERE profile_id = 'a0000000-0000-0000-0000-000000000003';
-- Expected: Error (WITH CHECK enforces centre_id must match current assignment)

RESET ROLE;
*/


-- ============================================================================
-- TEST 11: Operator can access permitted records at their assigned centre
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000003"}';
SET LOCAL ROLE authenticated;

-- Should see bookings at Centre Alpha
SELECT count(*) FROM public.bookings WHERE centre_id = 'c0000000-0000-0000-0000-000000000001';
-- Expected: >= 1

-- Should see queue entries at Centre Alpha
SELECT count(*) FROM public.queue_entries WHERE centre_id = 'c0000000-0000-0000-0000-000000000001';
-- Expected: >= 1

-- Should see procurements at Centre Alpha
SELECT count(*) FROM public.procurements WHERE centre_id = 'c0000000-0000-0000-0000-000000000001';
-- Expected: >= 1

-- Should see own operator record
SELECT count(*) FROM public.operators WHERE profile_id = auth.uid();
-- Expected: 1

RESET ROLE;
*/


-- ============================================================================
-- TEST 12: Admin can access authorized management records
-- ============================================================================
/*
SET LOCAL request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000005"}';
SET LOCAL ROLE authenticated;

-- Should see ALL profiles
SELECT count(*) FROM public.profiles;
-- Expected: 5

-- Should see ALL bookings
SELECT count(*) FROM public.bookings;
-- Expected: 2

-- Should see ALL centres (including inactive)
SELECT count(*) FROM public.centres;
-- Expected: 2

-- Should see ALL farmers
SELECT count(*) FROM public.farmers;
-- Expected: 2

-- Should see ALL operators
SELECT count(*) FROM public.operators;
-- Expected: 2

RESET ROLE;
*/


-- ============================================================================
-- TEST 13: Anonymous users cannot access protected application data
-- ============================================================================
/*
SET LOCAL ROLE anon;

SELECT count(*) FROM public.profiles;
-- Expected: 0 (no policies for anon role)

SELECT count(*) FROM public.bookings;
-- Expected: 0

SELECT count(*) FROM public.farmers;
-- Expected: 0

SELECT count(*) FROM public.payments;
-- Expected: 0

RESET ROLE;
*/


-- ============================================================================
-- CLEANUP (optional — run after tests)
-- ============================================================================
/*
-- Run as service_role/superuser to clean up test data

DELETE FROM public.notifications WHERE id IN ('n0000000-0000-0000-0000-000000000001', 'n0000000-0000-0000-0000-000000000002');
DELETE FROM public.payments WHERE id IN ('y0000000-0000-0000-0000-000000000001', 'y0000000-0000-0000-0000-000000000002');
DELETE FROM public.procurements WHERE id IN ('p0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002');
DELETE FROM public.queue_entries WHERE id IN ('q0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000002');
DELETE FROM public.bookings WHERE id IN ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002');
DELETE FROM public.slots WHERE id IN ('s0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000002');
DELETE FROM public.operators WHERE id IN ('o0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000002');
DELETE FROM public.admins WHERE id = 'd0000000-0000-0000-0000-000000000001';
DELETE FROM public.farmers WHERE id IN ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002');
DELETE FROM public.profiles WHERE id IN (
  'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);
DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006'
);
*/
