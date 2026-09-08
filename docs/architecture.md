# Architecture Overview

## Smart Agricultural Procurement Centre Management System

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth + Twilio Verify (mobile OTP) |
| Real-time | Supabase Realtime (queue updates, notifications) |
| Validation | Zod |

### Project Structure

```
src/
  app/              # Next.js App Router pages and layouts
  components/       # Reusable UI components
  features/         # Feature-specific modules (booking, queue, procurement, etc.)
  services/         # Business logic / service layer
  lib/
    supabase/       # Supabase client (browser), server, and middleware setup
    twilio/         # Twilio Verify integration (server-only)
    auth/           # Authentication helpers
    validations/    # Zod schemas for all entities
    realtime/       # Supabase Realtime subscription helpers
    utils/          # General utility functions
  types/            # TypeScript type definitions (including Supabase generated types)
  constants/        # App-wide constants (roles, statuses, config)
  styles/           # Global styles

supabase/
  migrations/       # PostgreSQL migration files (numbered)

docs/               # Project documentation
ml/                 # Machine learning module (future)
tests/
  unit/             # Unit tests
  integration/      # Integration tests
  e2e/              # End-to-end tests
```

### Architecture Principles

1. **Server-first**: Sensitive logic runs in Next.js Server Actions and API routes, never client-side.
2. **Type-safe**: Supabase-generated TypeScript types ensure database ↔ application type safety.
3. **Secure by default**: RLS enabled on all tables; auth checked at every layer.
4. **Progressive enhancement**: Core functionality works without JavaScript; real-time features enhance the experience.
5. **Validation at every boundary**: Zod schemas validate data at form, API, and service layers.

### Data Flow

```
Farmer (mobile browser)
  → Next.js App (SSR/Server Actions)
    → Supabase Client (with user's auth token)
      → PostgreSQL (RLS policies filter data)
        → Response (only authorized data returned)

Operator (desktop browser)
  → Next.js App (SSR/Server Actions)
    → Supabase Client (with operator's auth token)
      → PostgreSQL (RLS scoped to operator's centre)

Admin (desktop browser)
  → Next.js App (SSR/Server Actions)
    → Supabase Client (with admin's auth token)
      → PostgreSQL (full access per RLS policies)
```

### Real-time Architecture

Supabase Realtime will be used for:
- **Queue position updates**: Farmers see their live position
- **Queue management**: Operators see real-time queue changes
- **Notifications**: In-app notification delivery

Realtime subscriptions are scoped by RLS — a farmer only receives updates for their own data.
