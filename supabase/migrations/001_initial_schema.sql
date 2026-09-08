BEGIN;

-- Enable pgcrypto for gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE user_role AS ENUM ('FARMER', 'OPERATOR', 'ADMIN');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE queue_status AS ENUM ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');
CREATE TYPE procurement_status AS ENUM ('PENDING_QUALITY', 'QUALITY_DONE', 'PENDING_WEIGHING', 'WEIGHING_DONE', 'PENDING_PRICING', 'PRICING_DONE', 'ACCEPTED', 'REJECTED', 'COMPLETED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE');
CREATE TYPE notification_type AS ENUM ('SMS', 'IN_APP', 'PUSH');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
CREATE TYPE quality_grade AS ENUM ('A', 'B', 'C', 'D', 'REJECTED');
CREATE TYPE crop_category AS ENUM ('CEREAL', 'PULSE', 'OILSEED', 'SPICE', 'VEGETABLE', 'FRUIT', 'OTHER');

-- ==========================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TABLES
-- ==========================================

-- 1. profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. farmers
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    aadhaar_number_hash TEXT,
    land_holding_acres DECIMAL(10,2),
    primary_crop TEXT,
    village TEXT,
    taluk TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Karnataka',
    pincode TEXT,
    bank_account_number_encrypted TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE farmers IS 'Farmer-specific details. Sensitive fields (aadhaar, bank) are hashed/encrypted at application layer.';
COMMENT ON COLUMN farmers.aadhaar_number_hash IS 'Hashed Aadhaar number, never store plaintext';
COMMENT ON COLUMN farmers.bank_account_number_encrypted IS 'Encrypted bank account number';

-- 3. centres
CREATE TABLE centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    village TEXT,
    taluk TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Karnataka',
    pincode TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    contact_phone TEXT,
    operating_hours_start TIME NOT NULL DEFAULT '08:00',
    operating_hours_end TIME NOT NULL DEFAULT '17:00',
    max_daily_capacity INTEGER NOT NULL DEFAULT 50,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE centres IS 'Physical procurement centres (APMCs/mandis) where farmers bring crops.';
COMMENT ON COLUMN centres.code IS 'Unique code for the centre, e.g., KA-BLR-001';
COMMENT ON COLUMN centres.max_daily_capacity IS 'Maximum number of farmers that can be processed per day';

-- 4. operators
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE RESTRICT,
    employee_id TEXT UNIQUE,
    designation TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE operators IS 'Centre operators who manage day-to-day procurement operations.';

-- 5. admins
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    department TEXT,
    jurisdiction_level TEXT DEFAULT 'STATE',
    jurisdiction_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON COLUMN admins.jurisdiction_level IS 'Level of administrative jurisdiction (e.g., STATE, DISTRICT, TALUK)';
COMMENT ON COLUMN admins.jurisdiction_value IS 'Value of the jurisdiction (e.g., Karnataka, Bangalore Urban)';

-- 6. slots
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_bookings INTEGER NOT NULL DEFAULT 5,
    current_bookings INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(centre_id, date, start_time),
    CHECK(end_time > start_time),
    CHECK(current_bookings <= max_bookings)
);
COMMENT ON TABLE slots IS 'Time slots available for farmer bookings at a procurement centre.';

-- 7. bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number TEXT NOT NULL UNIQUE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE RESTRICT,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    expected_crop TEXT,
    expected_quantity_kg DECIMAL(10,2),
    crop_category crop_category,
    status booking_status NOT NULL DEFAULT 'PENDING',
    booked_at TIMESTAMPTZ DEFAULT now(),
    checked_in_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE bookings IS 'Farmer booking for a procurement slot at a centre. Token number is the farmer-facing identifier.';
COMMENT ON COLUMN bookings.token_number IS 'Display token like KA-BLR-001-20240115-042';

-- 8. queue_entries
CREATE TABLE queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
    queue_date DATE NOT NULL,
    position INTEGER NOT NULL,
    status queue_status NOT NULL DEFAULT 'WAITING',
    called_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_wait_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(centre_id, queue_date, position)
);
COMMENT ON TABLE queue_entries IS 'Live queue tracking for checked-in farmers at a centre on a given date.';

-- 9. procurements
CREATE TABLE procurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE RESTRICT,
    operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    crop_name TEXT NOT NULL,
    crop_category crop_category,
    quality_grade quality_grade,
    quality_notes TEXT,
    moisture_percentage DECIMAL(5,2),
    foreign_matter_percentage DECIMAL(5,2),
    gross_weight_kg DECIMAL(10,2),
    tare_weight_kg DECIMAL(10,2),
    net_weight_kg DECIMAL(10,2),
    price_per_kg DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    msp_applicable DECIMAL(10,2),
    status procurement_status NOT NULL DEFAULT 'PENDING_QUALITY',
    quality_checked_at TIMESTAMPTZ,
    weighing_done_at TIMESTAMPTZ,
    pricing_done_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE procurements IS 'Records the procurement process: quality check, weighing, pricing, and acceptance/rejection.';
COMMENT ON COLUMN procurements.msp_applicable IS 'Minimum Support Price applicable at the time of procurement';

-- 10. payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procurement_id UUID NOT NULL UNIQUE REFERENCES procurements(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL,
    payment_method payment_method,
    payment_reference TEXT,
    status payment_status NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE payments IS 'Payment records for completed procurements. Tracks payment method, status, and reference.';
COMMENT ON COLUMN payments.payment_reference IS 'Transaction ID or UTR number for the payment';

-- 11. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'IN_APP',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    status notification_status NOT NULL DEFAULT 'PENDING',
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE notifications IS 'Notifications sent to users (SMS, in-app, push).';

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_centres_updated_at BEFORE UPDATE ON centres FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queue_entries_updated_at BEFORE UPDATE ON queue_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_procurements_updated_at BEFORE UPDATE ON procurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- notifications has no updated_at

-- ==========================================
-- INDEXES
-- ==========================================

-- Skip creating redundant indexes on columns that already have UNIQUE constraints (e.g., profiles.phone, farmers.profile_id)
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_farmers_district ON farmers(district);
CREATE INDEX idx_centres_district ON centres(district);
CREATE INDEX idx_centres_is_active ON centres(is_active);
CREATE INDEX idx_operators_centre_id ON operators(centre_id);
CREATE INDEX idx_slots_centre_date ON slots(centre_id, date);
CREATE INDEX idx_slots_date_active ON slots(date, is_active);
CREATE INDEX idx_bookings_farmer_id ON bookings(farmer_id);
CREATE INDEX idx_bookings_centre_date ON bookings(centre_id, booking_date);
CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_queue_entries_centre_date ON queue_entries(centre_id, queue_date);
CREATE INDEX idx_queue_entries_status ON queue_entries(status);
CREATE INDEX idx_procurements_centre_id ON procurements(centre_id);
CREATE INDEX idx_procurements_status ON procurements(status);
CREATE INDEX idx_payments_farmer_id ON payments(farmer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

COMMIT;
