# 🌾 Krishi Mitra — Smart Agricultural Procurement

![Krishi Mitra Banner](https://via.placeholder.com/1200x400/15803d/ffffff?text=Krishi+Mitra)

**Krishi Mitra** is a Smart Agricultural Procurement Centre Management System built for the Smart India Hackathon. It digitalizes and streamlines the crop procurement process for farmers, operators, and administrators across government centres in Karnataka.

## 🌟 Key Features

*   **📱 OTP-Based Authentication:** Passwordless login using mobile numbers (powered by Supabase).
*   **📅 Slot Booking:** Farmers can reserve their time slots at nearby procurement centres in advance.
*   **⏳ Live Queue Tracking:** Real-time visibility into queue positions to minimize waiting time.
*   **🔐 Role-Based Dashboards:** Dedicated interfaces for Farmers, Centre Operators, and Administrators.
*   **📊 Transparent Operations:** Digital record-keeping of quality checks, weighing, pricing, and fast payouts.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React Server Components, Server Actions)
*   **Styling:** Custom Vanilla CSS Design System with CSS variables
*   **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, OTP Auth)
*   **Language:** TypeScript

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/krishi-mitra.git
cd krishi-mitra
```

### 2. Install dependencies

Make sure you have Node.js (v18+) installed.

```bash
npm install
```

### 3. Set up Environment Variables

**Security Note:** Never commit your `.env.local` file to GitHub. The repository is already configured with a `.gitignore` to prevent `.env.local` and `.env` files from being committed.

1.  Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
2.  Open `.env.local` and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *You can find these in your Supabase dashboard under **Project Settings > API**.*

### 4. Database Setup

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Execute the migration scripts found in the `supabase/migrations/` folder in this order:
    *   `001_initial_schema.sql` (Creates tables, enums, and triggers)
    *   `002_rls_policies.sql` (Applies Row Level Security for data isolation)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 👥 User Roles & Access

The system uses Supabase Row Level Security (RLS) to enforce strict data access based on user roles:

*   **🧑‍🌾 FARMER:** Can book slots, view their own queue status, and track their procurement history.
*   **👨‍💼 OPERATOR:** Assigned to specific centres. Can manage the queue, check-in farmers, and process procurements for their assigned centre.
*   **👑 ADMIN:** Full system overview, can manage centres and assign operators.

### How to assign roles (For Testing)

By default, new users registering via OTP are assigned the `FARMER` role. To test Operator or Admin dashboards:
1.  Register a new account via the app.
2.  Go to your Supabase Table Editor.
3.  Open the `profiles` table.
4.  Change the `role` column of your user from `FARMER` to `OPERATOR` or `ADMIN`.
5.  *(For Operators)*: Add an entry in the `operators` table linking your `profile_id` to a specific `centre_id`.

---

## 📁 Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── auth/           # Login and OTP verification flows
│   │   ├── centres/        # Public centres listing
│   │   ├── dashboard/      # Role-based dashboards (Farmer/Operator/Admin)
│   │   └── globals.css     # Global design system and theme variables
│   ├── components/         # Shared React components (Navbar, Footer, Sidebar)
│   ├── lib/                # Utilities and core logic
│   │   ├── auth/           # Authentication server actions
│   │   └── supabase/       # Supabase client configurations
│   └── types/              # TypeScript definitions (database schema)
└── supabase/
    └── migrations/         # SQL scripts for DB schema and RLS policies
```

---

## 🛡️ Environment Variables & Security

*   `.env.local` contains sensitive keys and is **ignored by git** to prevent accidental leaks.
*   We use `NEXT_PUBLIC_` only for keys that are safe to expose to the browser (like the Supabase Anon Key).
*   All sensitive database interactions are handled via Next.js **Server Actions** utilizing the server-side Supabase client.
*   **Row Level Security (RLS)** in PostgreSQL guarantees that even if the API is accessed directly, users can only see and modify data they own.

---

*Built with ❤️ for Smart India Hackathon.*
