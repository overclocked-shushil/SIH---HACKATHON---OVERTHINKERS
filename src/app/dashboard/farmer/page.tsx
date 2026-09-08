import { requireRole } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = { title: 'Farmer Dashboard | Krishi Mitra' };

export default async function FarmerDashboard() {
  const profile = await requireRole(['FARMER']);
  const supabase = await createClient();

  // Fetch farmer record
  const { data: farmer } = await supabase
    .from('farmers')
    .select('*')
    .eq('profile_id', profile.id)
    .single();

  // Fetch recent bookings
  const { data: bookings } = farmer
    ? await supabase
        .from('bookings')
        .select('*, centres(name, code)')
        .eq('farmer_id', farmer.id)
        .order('booking_date', { ascending: false })
        .limit(5)
    : { data: [] };

  const activeBookings = bookings?.filter(
    (b) => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status)
  ) || [];

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--foreground)',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome, {profile.full_name}! 👋
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
          {farmer?.district ? `${farmer.district}, Karnataka` : 'Karnataka'} •{' '}
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Book a Slot */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, var(--green-600), var(--green-500))',
            color: 'white',
            border: 'none',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📅</div>
          <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.375rem' }}>
            Book a Slot
          </h3>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem' }}>
            Reserve your time at a procurement centre
          </p>
          <Link
            href="/centres"
            className="btn btn-white btn-sm"
            style={{ textDecoration: 'none' }}
          >
            Browse Centres
          </Link>
        </div>

        {/* Active Bookings */}
        <div className="stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
          <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.375rem', color: 'var(--foreground)' }}>
            Active Bookings
          </h3>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: 'var(--green-700)',
              marginBottom: '0.25rem',
            }}
          >
            {activeBookings.length}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            {activeBookings.length === 0 ? 'No active bookings' : 'upcoming / in-progress'}
          </p>
        </div>

        {/* Queue Status */}
        <div className="stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.375rem', color: 'var(--foreground)' }}>
            Queue Status
          </h3>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: 'var(--amber-600)',
              marginBottom: '0.25rem',
            }}
          >
            —
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            Not in any queue
          </p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div style={{ marginBottom: '2rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            marginBottom: '1rem',
          }}
        >
          Recent Bookings
        </h2>

        {bookings && bookings.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Centre</th>
                  <th>Date</th>
                  <th>Crop</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {b.token_number}
                    </td>
                    <td>{(b.centres as { name: string } | null)?.name || '—'}</td>
                    <td>{new Date(b.booking_date).toLocaleDateString('en-IN')}</td>
                    <td>{b.expected_crop || '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          b.status === 'COMPLETED'
                            ? 'badge-green'
                            : b.status === 'CANCELLED' || b.status === 'NO_SHOW'
                            ? 'badge-red'
                            : b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
                            ? 'badge-blue'
                            : 'badge-amber'
                        }`}
                      >
                        {b.status}
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
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <p style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              No bookings yet
            </p>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Book a slot at a nearby procurement centre to get started.
            </p>
            <Link
              href="/centres"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Browse Centres
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
