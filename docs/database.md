# Database Schema Documentation

## Smart Agricultural Procurement Centre Management System

This document describes the database schema for the procurement centre scheduling
and queue-management platform for Karnataka, India.

---

## Entity Relationship Overview

```
auth.users (Supabase)
    │
    └── profiles (1:1)
         ├── farmers (1:1, role=FARMER)
         │    ├── bookings (1:N)
         │    └── payments (1:N)
         ├── operators (1:1, role=OPERATOR)
         │    └── centres (N:1)
         ├── admins (1:1, role=ADMIN)
         └── notifications (1:N)

centres
    ├── operators (1:N)
    ├── slots (1:N)
    ├── bookings (1:N)
    ├── queue_entries (1:N)
    └── procurements (1:N)

slots
    └── bookings (1:N)

bookings
    ├── queue_entries (1:1)
    └── procurements (1:1)

procurements
    └── payments (1:1)
```

---

## Enums

| Enum | Values | Purpose |
|------|--------|---------|
| `user_role` | FARMER, OPERATOR, ADMIN | Role-based access control |
| `booking_status` | PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW | Booking lifecycle tracking |
| `queue_status` | WAITING, CALLED, IN_PROGRESS, COMPLETED, SKIPPED, CANCELLED | Real-time queue state |
| `procurement_status` | PENDING_QUALITY, QUALITY_DONE, PENDING_WEIGHING, WEIGHING_DONE, PENDING_PRICING, PRICING_DONE, ACCEPTED, REJECTED, COMPLETED | Multi-step procurement process |
| `payment_status` | PENDING, PROCESSING, COMPLETED, FAILED | Payment lifecycle |
| `payment_method` | BANK_TRANSFER, UPI, CASH, CHEQUE | Payment type |
| `notification_type` | SMS, IN_APP, PUSH | Notification channel |
| `notification_status` | PENDING, SENT, DELIVERED, FAILED | Notification delivery tracking |
| `quality_grade` | A, B, C, D, REJECTED | Crop quality classification |
| `crop_category` | CEREAL, PULSE, OILSEED, SPICE, VEGETABLE, FRUIT, OTHER | Crop classification |

---

## Tables

### 1. `profiles`

**Purpose**: Extends Supabase `auth.users` with application-specific profile data.
Every authenticated user has exactly one profile. The `role` field determines access level.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | Matches the Supabase auth user ID |
| role | user_role | NOT NULL | FARMER, OPERATOR, or ADMIN |
| full_name | TEXT | NOT NULL | Display name |
| phone | TEXT | NOT NULL, UNIQUE | Indian mobile number (+91XXXXXXXXXX), used for OTP login |
| email | TEXT | | Optional email address |
| avatar_url | TEXT | | Profile photo URL |
| is_active | BOOLEAN | DEFAULT true | Soft-delete / deactivation flag |
| created_at | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Auto-updated via trigger |

---

### 2. `farmers`

**Purpose**: Farmer-specific details, linked 1:1 with a profile of role `FARMER`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, UNIQUE, FK → profiles(id) | Links to the user profile |
| aadhaar_number_hash | TEXT | | SHA-256 hash of Aadhaar number (never stored as plaintext) |
| land_holding_acres | DECIMAL(10,2) | | Self-reported agricultural land holding |
| primary_crop | TEXT | | Main crop the farmer grows |
| village | TEXT | | Village name |
| taluk | TEXT | | Taluk (sub-district) |
| district | TEXT | NOT NULL | District name |
| state | TEXT | NOT NULL, DEFAULT 'Karnataka' | State |
| pincode | TEXT | | Postal code |
| bank_account_number_encrypted | TEXT | | AES-256 encrypted bank account number |
| bank_ifsc | TEXT | | Bank IFSC code |
| bank_name | TEXT | | Bank name |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

> **Security Note**: `aadhaar_number_hash` and `bank_account_number_encrypted` are
> processed at the application layer. The database never sees plaintext sensitive data.

---

### 3. `centres`

**Purpose**: Physical procurement centres (APMCs / mandis) where farmers bring crops.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | TEXT | NOT NULL | Centre display name |
| code | TEXT | NOT NULL, UNIQUE | Human-readable code (e.g., KA-BLR-001) |
| address | TEXT | NOT NULL | Full address |
| village / taluk / district / state | TEXT | district NOT NULL, state DEFAULT 'Karnataka' | Location hierarchy |
| pincode | TEXT | | Postal code |
| latitude / longitude | DECIMAL(10,7) | | GPS coordinates |
| contact_phone | TEXT | | Centre phone number |
| operating_hours_start | TIME | NOT NULL, DEFAULT '08:00' | Daily opening time |
| operating_hours_end | TIME | NOT NULL, DEFAULT '17:00' | Daily closing time |
| max_daily_capacity | INTEGER | NOT NULL, DEFAULT 50 | Maximum farmers per day |
| slot_duration_minutes | INTEGER | NOT NULL, DEFAULT 30 | Slot length for scheduling |
| is_active | BOOLEAN | DEFAULT true | Active/inactive toggle |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

---

### 4. `operators`

**Purpose**: Centre operators who manage day-to-day procurement operations.
Each operator is assigned to exactly one centre.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| profile_id | UUID | NOT NULL, UNIQUE, FK → profiles(id) | Links to user profile |
| centre_id | UUID | NOT NULL, FK → centres(id) ON DELETE RESTRICT | Assigned centre |
| employee_id | TEXT | UNIQUE | Government employee ID |
| designation | TEXT | | Job title |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

> **Note**: ON DELETE RESTRICT on `centre_id` prevents deleting a centre that still has operators.

---

### 5. `admins`

**Purpose**: Administrative users with state/district/taluk-level oversight.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| profile_id | UUID | NOT NULL, UNIQUE, FK → profiles(id) | Links to user profile |
| department | TEXT | | Government department |
| jurisdiction_level | TEXT | DEFAULT 'STATE' | Scope: STATE, DISTRICT, or TALUK |
| jurisdiction_value | TEXT | | Specific jurisdiction name |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

---

### 6. `slots`

**Purpose**: Time slots available for farmer bookings at a centre on a given date.
Slots are generated per centre per day based on operating hours and slot duration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| centre_id | UUID | NOT NULL, FK → centres(id) ON DELETE CASCADE | Parent centre |
| date | DATE | NOT NULL | Slot date |
| start_time / end_time | TIME | NOT NULL | Slot time range |
| max_bookings | INTEGER | NOT NULL, DEFAULT 5 | Max farmers per slot |
| current_bookings | INTEGER | NOT NULL, DEFAULT 0 | Current booking count |
| is_active | BOOLEAN | DEFAULT true | Slot availability |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

**Constraints**:
- `UNIQUE(centre_id, date, start_time)` — no duplicate slots
- `CHECK(end_time > start_time)` — valid time range
- `CHECK(current_bookings <= max_bookings)` — capacity enforcement

---

### 7. `bookings`

**Purpose**: A farmer's booking for a procurement slot at a centre.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| token_number | TEXT | NOT NULL, UNIQUE | Farmer-facing token (e.g., KA-BLR-001-20240115-042) |
| farmer_id | UUID | NOT NULL, FK → farmers(id) | Booking farmer |
| centre_id | UUID | NOT NULL, FK → centres(id) | Target centre |
| slot_id | UUID | NOT NULL, FK → slots(id) | Reserved slot |
| booking_date | DATE | NOT NULL | Date of the booking |
| expected_crop | TEXT | | Crop the farmer intends to sell |
| expected_quantity_kg | DECIMAL(10,2) | | Self-reported expected quantity |
| crop_category | crop_category | | Category classification |
| status | booking_status | NOT NULL, DEFAULT 'PENDING' | Current lifecycle state |
| booked_at | TIMESTAMPTZ | DEFAULT now() | When the booking was made |
| checked_in_at | TIMESTAMPTZ | | When farmer arrived at centre |
| completed_at | TIMESTAMPTZ | | When procurement was completed |
| cancelled_at | TIMESTAMPTZ | | When booking was cancelled |
| cancellation_reason | TEXT | | Reason for cancellation |
| notes | TEXT | | Operator/system notes |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

---

### 8. `queue_entries`

**Purpose**: Real-time queue tracking for checked-in farmers at a centre.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| booking_id | UUID | NOT NULL, UNIQUE, FK → bookings(id) | Associated booking |
| centre_id | UUID | NOT NULL, FK → centres(id) | Centre for the queue |
| queue_date | DATE | NOT NULL | Queue date |
| position | INTEGER | NOT NULL | Queue position (1-based) |
| status | queue_status | NOT NULL, DEFAULT 'WAITING' | Queue state |
| called_at | TIMESTAMPTZ | | When farmer was called |
| started_at | TIMESTAMPTZ | | When processing started |
| completed_at | TIMESTAMPTZ | | When processing completed |
| estimated_wait_minutes | INTEGER | | Calculated wait time |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

**Constraints**:
- `UNIQUE(centre_id, queue_date, position)` — no duplicate positions per day per centre

---

### 9. `procurements`

**Purpose**: Records the full procurement process from quality check through pricing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| booking_id | UUID | NOT NULL, UNIQUE, FK → bookings(id) | Source booking |
| centre_id | UUID | NOT NULL, FK → centres(id) | Processing centre |
| operator_id | UUID | FK → operators(id) ON DELETE SET NULL | Handling operator |
| crop_name | TEXT | NOT NULL | Actual crop name |
| crop_category | crop_category | | Category |
| quality_grade | quality_grade | | A/B/C/D/REJECTED |
| quality_notes | TEXT | | Inspector notes |
| moisture_percentage | DECIMAL(5,2) | | Moisture content % |
| foreign_matter_percentage | DECIMAL(5,2) | | Foreign matter % |
| gross_weight_kg | DECIMAL(10,2) | | Total weight including container |
| tare_weight_kg | DECIMAL(10,2) | | Container/vehicle weight |
| net_weight_kg | DECIMAL(10,2) | | Actual crop weight (gross - tare) |
| price_per_kg | DECIMAL(10,2) | | Agreed price per kg (INR) |
| total_amount | DECIMAL(12,2) | | Total payment amount (INR) |
| msp_applicable | DECIMAL(10,2) | | Government MSP for this crop |
| status | procurement_status | NOT NULL, DEFAULT 'PENDING_QUALITY' | Process stage |
| quality_checked_at | TIMESTAMPTZ | | Quality inspection timestamp |
| weighing_done_at | TIMESTAMPTZ | | Weighing completion timestamp |
| pricing_done_at | TIMESTAMPTZ | | Pricing determination timestamp |
| completed_at / rejected_at | TIMESTAMPTZ | | Final outcome timestamp |
| rejection_reason | TEXT | | Reason if rejected |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

---

### 10. `payments`

**Purpose**: Payment records for completed procurements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| procurement_id | UUID | NOT NULL, UNIQUE, FK → procurements(id) | Source procurement |
| farmer_id | UUID | NOT NULL, FK → farmers(id) | Receiving farmer |
| amount | DECIMAL(12,2) | NOT NULL | Payment amount (INR) |
| payment_method | payment_method | | BANK_TRANSFER, UPI, CASH, or CHEQUE |
| payment_reference | TEXT | | UTR / transaction ID / cheque number |
| status | payment_status | NOT NULL, DEFAULT 'PENDING' | Payment state |
| paid_at | TIMESTAMPTZ | | When payment was made |
| failure_reason | TEXT | | Reason if payment failed |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT now() | Timestamps |

---

### 11. `notifications`

**Purpose**: Notifications sent to users across channels (SMS, in-app, push).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| profile_id | UUID | NOT NULL, FK → profiles(id) | Recipient user |
| type | notification_type | NOT NULL, DEFAULT 'IN_APP' | Channel |
| title | TEXT | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| data | JSONB | | Flexible metadata (booking_id, queue position, etc.) |
| status | notification_status | NOT NULL, DEFAULT 'PENDING' | Delivery status |
| read_at | TIMESTAMPTZ | | When user read the notification |
| sent_at | TIMESTAMPTZ | | When notification was sent |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

---

## Booking Lifecycle

A booking progresses through the following states:

```
PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
   │          │            │
   ├→ CANCELLED  ├→ CANCELLED  ├→ NO_SHOW
   └→ (expired)  └→ NO_SHOW
```

1. **PENDING**: Farmer creates a booking and selects a slot. Token number is generated.
2. **CONFIRMED**: System confirms the booking (slot availability verified, counter incremented).
3. **CHECKED_IN**: Farmer physically arrives at the centre and checks in. `checked_in_at` is recorded. A `queue_entry` is created.
4. **IN_PROGRESS**: Farmer is called from the queue and procurement process begins. A `procurement` record is created.
5. **COMPLETED**: Procurement is finished (quality check, weighing, pricing done). `completed_at` is recorded.
6. **CANCELLED**: Booking was cancelled by farmer or operator before completion. `cancelled_at` and `cancellation_reason` are recorded.
7. **NO_SHOW**: Farmer did not arrive during their slot window.

---

## Queue Lifecycle

Queue entries track the real-time position of checked-in farmers:

```
WAITING → CALLED → IN_PROGRESS → COMPLETED
   │         │          │
   ├→ CANCELLED ├→ SKIPPED  └→ (back to WAITING on issue)
   └→ SKIPPED
```

1. **WAITING**: Farmer is checked in and waiting in the queue. `position` determines order.
2. **CALLED**: Operator calls the next farmer. `called_at` is recorded. Farmer is notified.
3. **IN_PROGRESS**: Farmer is at the counter and procurement is underway. `started_at` recorded.
4. **COMPLETED**: Processing is done. `completed_at` is recorded.
5. **SKIPPED**: Farmer was called but didn't respond. May be re-queued.
6. **CANCELLED**: Farmer left the queue voluntarily.

`estimated_wait_minutes` is calculated by the application based on:
- Current queue position
- Average processing time per farmer
- Number of active counters

---

## Procurement Lifecycle

Procurement tracks the multi-step process at the centre:

```
PENDING_QUALITY → QUALITY_DONE → PENDING_WEIGHING → WEIGHING_DONE
     → PENDING_PRICING → PRICING_DONE → ACCEPTED → COMPLETED
                                         └→ REJECTED
```

1. **PENDING_QUALITY**: Awaiting quality inspection.
2. **QUALITY_DONE**: Inspector has checked moisture, foreign matter, and assigned a grade.
3. **PENDING_WEIGHING**: Awaiting weighing.
4. **WEIGHING_DONE**: Gross, tare, and net weights recorded.
5. **PENDING_PRICING**: Awaiting price determination (based on grade, MSP, market rate).
6. **PRICING_DONE**: Price per kg and total amount calculated.
7. **ACCEPTED**: Farmer accepts the offered price.
8. **REJECTED**: Crop rejected (quality too low, or farmer rejects the price).
9. **COMPLETED**: Procurement finalized, payment record created.

---

## Key Constraints Summary

| Constraint | Table | Purpose |
|------------|-------|---------|
| profiles.phone UNIQUE | profiles | One account per phone number |
| farmers.profile_id UNIQUE | farmers | One farmer record per profile |
| operators.profile_id UNIQUE | operators | One operator record per profile |
| admins.profile_id UNIQUE | admins | One admin record per profile |
| centres.code UNIQUE | centres | Human-readable centre identification |
| slots (centre_id, date, start_time) UNIQUE | slots | No duplicate slots |
| slots: end_time > start_time CHECK | slots | Valid time range |
| slots: current_bookings ≤ max_bookings CHECK | slots | Capacity control |
| bookings.token_number UNIQUE | bookings | Unique farmer-facing tokens |
| queue_entries.booking_id UNIQUE | queue_entries | One queue entry per booking |
| queue_entries (centre_id, queue_date, position) UNIQUE | queue_entries | No duplicate queue positions |
| procurements.booking_id UNIQUE | procurements | One procurement per booking |
| payments.procurement_id UNIQUE | payments | One payment per procurement |

---

## Indexes

All tables have indexes on frequently queried columns. UNIQUE constraints
automatically create indexes, so additional indexes are only created on
non-unique columns used in WHERE/JOIN clauses:

- `profiles(role)` — filter users by role
- `farmers(district)` — geographic queries
- `centres(district)`, `centres(is_active)` — centre lookups
- `operators(centre_id)` — find operators for a centre
- `slots(centre_id, date)`, `slots(date, is_active)` — slot availability queries
- `bookings(farmer_id)`, `bookings(centre_id, booking_date)`, `bookings(slot_id)`, `bookings(status)` — booking lookups
- `queue_entries(centre_id, queue_date)`, `queue_entries(status)` — real-time queue queries
- `procurements(centre_id)`, `procurements(status)` — procurement tracking
- `payments(farmer_id)`, `payments(status)` — payment queries
- `notifications(profile_id)`, `notifications(status)` — notification delivery

---

## Row Level Security

RLS is **enabled** on all tables. Policies are not yet defined and will be
added in a subsequent migration (`002_rls_policies.sql`). Until policies are
created, no data is accessible through the Supabase client — this is a
secure-by-default configuration.
