-- ============================================================================
-- 002_rls_policies.sql
-- Row Level Security Policies for all application tables.
--
-- Authorization root: auth.uid()
-- Role resolution:    profiles.role via SECURITY DEFINER helper
-- Ownership chains:
--   FARMER   → profiles.id = auth.uid()  → farmers.profile_id
--   OPERATOR → profiles.id = auth.uid()  → operators.profile_id → operators.centre_id
--   ADMIN    → profiles.id = auth.uid()  → admins.profile_id
--
-- Principles:
--   1. Least privilege — grant only what is needed for legitimate operations
--   2. Defence in depth — RLS is one layer; server-side checks are another
--   3. No client trust — role/ownership always derived from auth.uid()
--   4. Secure by default — no data accessible without an explicit policy
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================================================
-- These SECURITY DEFINER functions bypass RLS to resolve the authenticated
-- user's role and centre assignment. They are necessary to avoid recursive
-- RLS evaluation when policies on `profiles` or `operators` reference
-- themselves.
--
-- SECURITY DEFINER is justified here because:
--   - The functions return only a single scalar value (role enum or UUID)
--   - They are narrowly scoped to the authenticated user's own data
--   - They prevent infinite recursion in RLS policy evaluation
--   - search_path is locked to prevent search-path hijacking
-- ============================================================================

-- Returns the role of the currently authenticated user.
-- Returns NULL if no profile exists (unauthenticated or unregistered).
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_role() IS
  'Returns the role (FARMER/OPERATOR/ADMIN) of the authenticated user. '
  'SECURITY DEFINER to bypass profiles RLS and prevent recursion. '
  'Returns NULL for unauthenticated or unregistered users.';

-- Returns the farmer.id for the currently authenticated user.
-- Returns NULL if the user is not a farmer.
CREATE OR REPLACE FUNCTION public.get_my_farmer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.farmers WHERE profile_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_my_farmer_id() IS
  'Returns the farmers.id for the authenticated user. '
  'SECURITY DEFINER to bypass farmers RLS and prevent recursion. '
  'Returns NULL if the user is not a farmer.';

-- Returns the centre_id assigned to the currently authenticated operator.
-- Returns NULL if the user is not an operator.
CREATE OR REPLACE FUNCTION public.get_operator_centre_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT centre_id FROM public.operators
  WHERE profile_id = auth.uid() AND is_active = true;
$$;

COMMENT ON FUNCTION public.get_operator_centre_id() IS
  'Returns the centre_id assigned to the authenticated operator. '
  'SECURITY DEFINER to bypass operators RLS and prevent recursion. '
  'Only returns for active operators. Returns NULL otherwise.';


-- ============================================================================
-- SECTION 2: profiles
-- ============================================================================
-- SELECT: All authenticated users read their own profile.
--         ADMINs can read all profiles.
--         OPERATORs can read profiles of farmers who have bookings at their centre.
-- INSERT: Allowed for authenticated users creating their own profile (id = auth.uid()).
--         Role is set at insert time; application layer must control this.
-- UPDATE: Users can update their own profile fields (but NOT role).
-- DELETE: Not allowed via RLS. Profile deletion cascades from auth.users.
-- ============================================================================

-- SELECT: own profile
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- SELECT: admin reads all profiles
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- SELECT: operator reads farmer profiles at their centre (via bookings → farmers → profiles)
CREATE POLICY profiles_select_operator ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND id IN (
      SELECT f.profile_id
      FROM public.farmers f
      INNER JOIN public.bookings b ON b.farmer_id = f.id
      WHERE b.centre_id = public.get_operator_centre_id()
    )
  );

-- INSERT: user creates their own profile during registration
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: user updates own profile, but cannot change role
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- UPDATE: admin can update any profile
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (true);

-- No DELETE policy: profiles are deleted via auth.users cascade


-- ============================================================================
-- SECTION 3: farmers
-- ============================================================================
-- SELECT: Farmer reads own record. Operator reads farmers at their centre.
--         Admin reads all.
-- INSERT: Farmer creates own record (profile_id = auth.uid()).
-- UPDATE: Farmer updates own non-ownership fields. Admin updates any.
-- DELETE: Not allowed. Farmers are deactivated via profiles.is_active.
-- ============================================================================

-- SELECT: own farmer record
CREATE POLICY farmers_select_own ON public.farmers
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- SELECT: operator reads farmers with bookings at their centre
CREATE POLICY farmers_select_operator ON public.farmers
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND id IN (
      SELECT b.farmer_id
      FROM public.bookings b
      WHERE b.centre_id = public.get_operator_centre_id()
    )
  );

-- SELECT: admin reads all farmers
CREATE POLICY farmers_select_admin ON public.farmers
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: farmer creates own record; profile_id must match auth.uid()
CREATE POLICY farmers_insert_own ON public.farmers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND public.get_user_role() = 'FARMER'
  );

-- INSERT: admin can create farmer records (for admin-assisted registration)
CREATE POLICY farmers_insert_admin ON public.farmers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: farmer updates own record; cannot change profile_id ownership
CREATE POLICY farmers_update_own ON public.farmers
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- UPDATE: admin updates any farmer
CREATE POLICY farmers_update_admin ON public.farmers
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (true);

-- No DELETE policy: soft-delete via profiles.is_active


-- ============================================================================
-- SECTION 4: centres
-- ============================================================================
-- SELECT: All authenticated users can read active centres (for browsing).
--         Admin can read all centres including inactive ones.
-- INSERT: Admin only.
-- UPDATE: Admin only.
-- DELETE: Not allowed. Centres are deactivated via is_active.
-- ============================================================================

-- SELECT: any authenticated user reads active centres
CREATE POLICY centres_select_active ON public.centres
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- SELECT: admin reads all centres (including inactive)
CREATE POLICY centres_select_admin ON public.centres
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: admin only
CREATE POLICY centres_insert_admin ON public.centres
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: admin only
CREATE POLICY centres_update_admin ON public.centres
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- No DELETE policy: use is_active = false


-- ============================================================================
-- SECTION 5: operators
-- ============================================================================
-- SELECT: Operator reads own record. Admin reads all.
-- INSERT: Admin only (operators are created by admins).
-- UPDATE: Operator can update own non-sensitive fields (not centre_id, not role).
--         Admin can update any operator.
-- DELETE: Not allowed. Operators are deactivated via is_active.
-- ============================================================================

-- SELECT: operator reads own record
CREATE POLICY operators_select_own ON public.operators
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- SELECT: admin reads all operators
CREATE POLICY operators_select_admin ON public.operators
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: admin only
CREATE POLICY operators_insert_admin ON public.operators
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: operator updates own record; cannot change centre_id or profile_id
CREATE POLICY operators_update_own ON public.operators
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    AND centre_id = (SELECT centre_id FROM public.operators WHERE profile_id = auth.uid())
  );

-- UPDATE: admin updates any operator
CREATE POLICY operators_update_admin ON public.operators
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- No DELETE policy: use is_active = false


-- ============================================================================
-- SECTION 6: admins
-- ============================================================================
-- SELECT: Admin reads own record. Admin reads all admin records.
-- INSERT: Admin only (admins are created by other admins or via service role).
-- UPDATE: Admin updates own record.
-- DELETE: Not allowed.
-- ============================================================================

-- SELECT: admin reads own record
CREATE POLICY admins_select_own ON public.admins
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- SELECT: admin reads all admin records (for admin management)
CREATE POLICY admins_select_admin ON public.admins
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: admin only (or service role for bootstrapping)
CREATE POLICY admins_insert_admin ON public.admins
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: admin updates own record
CREATE POLICY admins_update_own ON public.admins
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid() AND public.get_user_role() = 'ADMIN')
  WITH CHECK (profile_id = auth.uid());

-- No DELETE policy


-- ============================================================================
-- SECTION 7: slots
-- ============================================================================
-- SELECT: All authenticated users read active slots (for booking flow).
--         Operator reads all slots at their centre.
--         Admin reads all slots.
-- INSERT: Admin only (slots are generated by the system/admin).
-- UPDATE: Admin only. Operator can update current_bookings at their centre
--         (done via server-side logic, but RLS permits it).
-- DELETE: Not allowed. Slots are deactivated via is_active.
-- ============================================================================

-- SELECT: any authenticated user reads active slots
CREATE POLICY slots_select_active ON public.slots
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- SELECT: operator reads all slots at their centre (including inactive)
CREATE POLICY slots_select_operator ON public.slots
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  );

-- SELECT: admin reads all slots
CREATE POLICY slots_select_admin ON public.slots
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: admin only
CREATE POLICY slots_insert_admin ON public.slots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: admin updates any slot
CREATE POLICY slots_update_admin ON public.slots
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: operator can update slots at their centre (e.g., current_bookings counter)
CREATE POLICY slots_update_operator ON public.slots
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  )
  WITH CHECK (centre_id = public.get_operator_centre_id());

-- No DELETE policy: use is_active = false


-- ============================================================================
-- SECTION 8: bookings
-- ============================================================================
-- SELECT: Farmer reads own bookings. Operator reads bookings at their centre.
--         Admin reads all.
-- INSERT: Farmer creates own bookings (farmer_id must resolve to auth.uid()).
-- UPDATE: Farmer can update own bookings (limited: cancel PENDING/CONFIRMED).
--         Operator updates bookings at their centre (check-in, status changes).
--         Admin updates any booking.
-- DELETE: Not allowed. Use status transitions (CANCELLED).
-- ============================================================================

-- SELECT: farmer reads own bookings
CREATE POLICY bookings_select_farmer ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'FARMER'
    AND farmer_id = public.get_my_farmer_id()
  );

-- SELECT: operator reads bookings at their centre
CREATE POLICY bookings_select_operator ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  );

-- SELECT: admin reads all bookings
CREATE POLICY bookings_select_admin ON public.bookings
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: farmer creates own bookings
CREATE POLICY bookings_insert_farmer ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'FARMER'
    AND farmer_id = public.get_my_farmer_id()
  );

-- UPDATE: farmer updates own bookings (cancel only — status enforcement is app-layer)
CREATE POLICY bookings_update_farmer ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'FARMER'
    AND farmer_id = public.get_my_farmer_id()
  )
  WITH CHECK (farmer_id = public.get_my_farmer_id());

-- UPDATE: operator updates bookings at their centre
CREATE POLICY bookings_update_operator ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  )
  WITH CHECK (centre_id = public.get_operator_centre_id());

-- UPDATE: admin updates any booking
CREATE POLICY bookings_update_admin ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (true);

-- No DELETE policy: use CANCELLED status


-- ============================================================================
-- SECTION 9: queue_entries
-- ============================================================================
-- SELECT: Farmer reads own queue entry (via booking ownership).
--         Operator reads queue at their centre. Admin reads all.
-- INSERT: Operator creates queue entries at their centre (at check-in).
--         Admin can create any.
-- UPDATE: Operator updates queue entries at their centre (call, skip, complete).
--         Admin updates any.
-- DELETE: Not allowed.
-- ============================================================================

-- SELECT: farmer reads own queue entry
CREATE POLICY queue_select_farmer ON public.queue_entries
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'FARMER'
    AND booking_id IN (
      SELECT id FROM public.bookings
      WHERE farmer_id = public.get_my_farmer_id()
    )
  );

-- SELECT: operator reads queue at their centre
CREATE POLICY queue_select_operator ON public.queue_entries
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  );

-- SELECT: admin reads all queue entries
CREATE POLICY queue_select_admin ON public.queue_entries
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: operator creates queue entries at their centre
CREATE POLICY queue_insert_operator ON public.queue_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  );

-- INSERT: admin creates any queue entry
CREATE POLICY queue_insert_admin ON public.queue_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: operator updates queue at their centre
CREATE POLICY queue_update_operator ON public.queue_entries
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  )
  WITH CHECK (centre_id = public.get_operator_centre_id());

-- UPDATE: admin updates any queue entry
CREATE POLICY queue_update_admin ON public.queue_entries
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (true);

-- No DELETE policy


-- ============================================================================
-- SECTION 10: procurements
-- ============================================================================
-- SELECT: Farmer reads own procurement (via booking). Operator reads at their
--         centre. Admin reads all.
-- INSERT: Operator creates at their centre. Admin creates any.
-- UPDATE: Operator updates at their centre (quality, weighing, pricing flow).
--         Admin updates any. Farmer CANNOT update.
-- DELETE: Not allowed.
-- ============================================================================

-- SELECT: farmer reads own procurement
CREATE POLICY procurements_select_farmer ON public.procurements
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'FARMER'
    AND booking_id IN (
      SELECT id FROM public.bookings
      WHERE farmer_id = public.get_my_farmer_id()
    )
  );

-- SELECT: operator reads procurements at their centre
CREATE POLICY procurements_select_operator ON public.procurements
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  );

-- SELECT: admin reads all procurements
CREATE POLICY procurements_select_admin ON public.procurements
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: operator creates procurement at their centre
CREATE POLICY procurements_insert_operator ON public.procurements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  );

-- INSERT: admin creates any procurement
CREATE POLICY procurements_insert_admin ON public.procurements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: operator updates procurement at their centre
CREATE POLICY procurements_update_operator ON public.procurements
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND centre_id = public.get_operator_centre_id()
  )
  WITH CHECK (centre_id = public.get_operator_centre_id());

-- UPDATE: admin updates any procurement
CREATE POLICY procurements_update_admin ON public.procurements
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (true);

-- No DELETE policy


-- ============================================================================
-- SECTION 11: payments
-- ============================================================================
-- SELECT: Farmer reads own payments. Operator reads at their centre.
--         Admin reads all.
-- INSERT: Operator creates at their centre. Admin creates any.
--         Farmer CANNOT create or modify payments.
-- UPDATE: Operator updates at their centre. Admin updates any.
-- DELETE: Not allowed.
-- ============================================================================

-- SELECT: farmer reads own payments
CREATE POLICY payments_select_farmer ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'FARMER'
    AND farmer_id = public.get_my_farmer_id()
  );

-- SELECT: operator reads payments at their centre (via procurement → centre_id)
CREATE POLICY payments_select_operator ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND procurement_id IN (
      SELECT id FROM public.procurements
      WHERE centre_id = public.get_operator_centre_id()
    )
  );

-- SELECT: admin reads all payments
CREATE POLICY payments_select_admin ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'ADMIN');

-- INSERT: operator creates payment at their centre
CREATE POLICY payments_insert_operator ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'OPERATOR'
    AND procurement_id IN (
      SELECT id FROM public.procurements
      WHERE centre_id = public.get_operator_centre_id()
    )
  );

-- INSERT: admin creates any payment
CREATE POLICY payments_insert_admin ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: operator updates payment at their centre
CREATE POLICY payments_update_operator ON public.payments
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'OPERATOR'
    AND procurement_id IN (
      SELECT id FROM public.procurements
      WHERE centre_id = public.get_operator_centre_id()
    )
  )
  WITH CHECK (
    procurement_id IN (
      SELECT id FROM public.procurements
      WHERE centre_id = public.get_operator_centre_id()
    )
  );

-- UPDATE: admin updates any payment
CREATE POLICY payments_update_admin ON public.payments
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (true);

-- No DELETE policy


-- ============================================================================
-- SECTION 12: notifications
-- ============================================================================
-- SELECT: User reads own notifications.
-- INSERT: Admin creates notifications (system-generated via server/service role).
-- UPDATE: User can mark own notification as read (update read_at only).
--         Admin can update any notification.
-- DELETE: Not allowed.
-- ============================================================================

-- SELECT: user reads own notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- INSERT: admin creates notifications
CREATE POLICY notifications_insert_admin ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- UPDATE: user marks own notification as read
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- UPDATE: admin updates any notification
CREATE POLICY notifications_update_admin ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (true);

-- No DELETE policy


-- ============================================================================
-- SECTION 13: GRANT EXECUTE on helper functions
-- ============================================================================
-- The helper functions need to be callable by authenticated users via the
-- Supabase anon/authenticated roles.
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_farmer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_operator_centre_id() TO authenticated;

-- Revoke from anon to prevent unauthenticated access
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_farmer_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_operator_centre_id() FROM anon;

COMMIT;
