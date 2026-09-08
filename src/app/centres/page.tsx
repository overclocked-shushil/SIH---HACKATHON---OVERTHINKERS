import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Procurement Centres | Krishi Mitra',
  description: 'Find agricultural procurement centres near you across Karnataka.',
};

export default async function CentresPage() {
  const supabase = await createClient();

  const { data: centres } = await supabase
    .from('centres')
    .select('*')
    .eq('is_active', true)
    .order('district', { ascending: true });

  return (
    <div className="flex flex-col flex-1">
      <Navbar />

      <main className="gradient-earth" style={{ flex: 1 }}>
        {/* Header */}
        <section
          className="gradient-hero"
          style={{ padding: '3rem 1.5rem', textAlign: 'center' }}
        >
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 900,
              color: 'white',
              marginBottom: '0.5rem',
            }}
          >
            Procurement Centres
          </h1>
          <p style={{ color: 'var(--green-200)', fontSize: '1.0625rem' }}>
            Find a centre near you and book your slot
          </p>
        </section>

        {/* Centres grid */}
        <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          {centres && centres.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {centres.map((c) => (
                <div key={c.id} className="glass-card" style={{ padding: '1.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '1.125rem',
                          color: 'var(--foreground)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {c.name}
                      </h3>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8125rem',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {c.code}
                      </span>
                    </div>
                    <span className="badge badge-green">Active</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📍</span>
                      <span>
                        {c.address}, {c.district}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🕐</span>
                      <span>
                        {c.operating_hours_start} – {c.operating_hours_end}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>👥</span>
                      <span>Capacity: {c.max_daily_capacity} farmers / day</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⏱️</span>
                      <span>Slot: {c.slot_duration_minutes} min</span>
                    </div>
                    {c.contact_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📞</span>
                        <span>{c.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="glass-card"
              style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '32rem', margin: '0 auto' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
              <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                No Centres Available
              </h2>
              <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
                Procurement centres will appear here once they are configured in the system.
                Please check back later.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
