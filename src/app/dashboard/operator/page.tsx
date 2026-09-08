import { requireRole } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Operator Dashboard | Krishi Mitra' };

export default async function OperatorDashboard() {
  const profile = await requireRole(['OPERATOR']);
  const supabase = await createClient();

  // Fetch operator record
  const { data: operator } = await supabase
    .from('operators')
    .select('*, centres(*)')
    .eq('profile_id', profile.id)
    .single();

  const centre = operator?.centres as {
    name: string;
    code: string;
    max_daily_capacity: number;
  } | null;

  const today = new Date().toISOString().split('T')[0];

  // Fetch today's bookings for the centre
  const { data: todayBookings } = operator
    ? await supabase
        .from('bookings')
        .select('*')
        .eq('centre_id', operator.centre_id)
        .eq('booking_date', today)
    : { data: [] };

  // Fetch today's queue
  const { data: queueEntries } = operator
    ? await supabase
        .from('queue_entries')
        .select('*, bookings(token_number, expected_crop, farmers(profile_id, profiles(full_name)))')
        .eq('centre_id', operator.centre_id)
        .eq('queue_date', today)
        .order('position', { ascending: true })
    : { data: [] };

  const checkedIn = todayBookings?.filter((b) => b.status === 'CHECKED_IN').length || 0;
  const completed = todayBookings?.filter((b) => b.status === 'COMPLETED').length || 0;
  const waiting = queueEntries?.filter((q) => q.status === 'WAITING').length || 0;

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
          Operator Dashboard
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
          {centre ? `${centre.name} (${centre.code})` : 'No centre assigned'} • Today:{' '}
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              className="feature-icon"
              style={{ background: 'var(--amber-100)', width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}
            >
              📋
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today&apos;s Bookings
            </span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--foreground)' }}>
            {todayBookings?.length || 0}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              className="feature-icon"
              style={{ background: '#dbeafe', width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}
            >
              ✅
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Checked In
            </span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--info)' }}>
            {checkedIn}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              className="feature-icon"
              style={{ background: 'var(--amber-100)', width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}
            >
              ⏳
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              In Queue
            </span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--amber-600)' }}>
            {waiting}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              className="feature-icon"
              style={{ background: 'var(--green-100)', width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}
            >
              🎉
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed
            </span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--green-700)' }}>
            {completed}
          </div>
        </div>
      </div>

      {/* Queue */}
      <div>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            marginBottom: '1rem',
          }}
        >
          Today&apos;s Queue
        </h2>

        {queueEntries && queueEntries.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Token</th>
                  <th>Status</th>
                  <th>Wait (min)</th>
                </tr>
              </thead>
              <tbody>
                {queueEntries.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 700 }}>{q.position}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {(q.bookings as { token_number: string } | null)?.token_number || '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          q.status === 'COMPLETED'
                            ? 'badge-green'
                            : q.status === 'CALLED'
                            ? 'badge-blue'
                            : q.status === 'IN_PROGRESS'
                            ? 'badge-amber'
                            : q.status === 'SKIPPED'
                            ? 'badge-red'
                            : 'badge-gray'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td>{q.estimated_wait_minutes ?? '—'}</td>
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
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              No farmers in queue today
            </p>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Farmers will appear here once they check in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
