import { requireRole } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Admin Dashboard | Krishi Mitra' };

export default async function AdminDashboard() {
  await requireRole(['ADMIN']);
  const supabase = await createClient();

  // Fetch aggregate stats
  const { count: centreCount } = await supabase
    .from('centres')
    .select('*', { count: 'exact', head: true });

  const { count: farmerCount } = await supabase
    .from('farmers')
    .select('*', { count: 'exact', head: true });

  const { count: operatorCount } = await supabase
    .from('operators')
    .select('*', { count: 'exact', head: true });

  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  // Fetch recent centres
  const { data: centres } = await supabase
    .from('centres')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const stats = [
    { icon: '🏢', label: 'Centres', value: centreCount || 0, color: 'var(--green-700)' },
    { icon: '👨‍🌾', label: 'Farmers', value: farmerCount || 0, color: 'var(--amber-600)' },
    { icon: '👥', label: 'Operators', value: operatorCount || 0, color: 'var(--info)' },
    { icon: '📋', label: 'Total Bookings', value: bookingCount || 0, color: 'var(--green-700)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--foreground)',
            letterSpacing: '-0.02em',
          }}
        >
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
          System-wide overview •{' '}
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {s.label}
              </span>
            </div>
            <div
              style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: s.color,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Centres table */}
      <div>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            marginBottom: '1rem',
          }}
        >
          Procurement Centres
        </h2>

        {centres && centres.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>District</th>
                  <th>Capacity</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {centres.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {c.code}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.district}</td>
                    <td>{c.max_daily_capacity} / day</td>
                    <td>
                      {c.operating_hours_start} – {c.operating_hours_end}
                    </td>
                    <td>
                      <span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="glass-card"
            style={{ padding: '3rem 2rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏗️</div>
            <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              No centres configured yet
            </p>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Centres need to be added to the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
