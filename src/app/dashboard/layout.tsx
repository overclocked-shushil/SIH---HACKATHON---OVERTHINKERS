import { getCurrentProfile } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

export const metadata = {
  title: 'Dashboard | Krishi Mitra',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/auth');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <DashboardSidebar role={profile.role} fullName={profile.full_name} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top header */}
        <header
          style={{
            height: '4rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            background: 'white',
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--foreground)' }}>
            🌾 Krishi Mitra
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-green">{profile.role}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              {profile.full_name}
            </span>
          </div>
        </header>
        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: '2rem',
            background: 'var(--earth-50)',
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
