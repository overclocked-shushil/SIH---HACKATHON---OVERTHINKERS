import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const FEATURES = [
  {
    icon: '📅',
    color: 'var(--green-100)',
    iconColor: 'var(--green-700)',
    title: 'Book Time Slots',
    description:
      'Reserve your spot at any procurement centre in advance. No more unplanned trips or endless waiting.',
  },
  {
    icon: '📊',
    color: 'var(--amber-100)',
    iconColor: 'var(--amber-700)',
    title: 'Live Queue Tracking',
    description:
      'See your real-time queue position from your phone. Arrive exactly when it\'s your turn.',
  },
  {
    icon: '⚖️',
    color: '#dbeafe',
    iconColor: '#1e40af',
    title: 'Transparent Grading',
    description:
      'Quality inspections, weighing, and pricing — every step recorded digitally for full transparency.',
  },
  {
    icon: '💳',
    color: '#fce7f3',
    iconColor: '#9d174d',
    title: 'Fast Payments',
    description:
      'Receive payments directly to your bank account via UPI or NEFT. Track every payment online.',
  },
];

const STEPS = [
  { step: 1, title: 'Register', description: 'Sign up with your mobile number via OTP', color: 'var(--green-600)' },
  { step: 2, title: 'Book a Slot', description: 'Choose a centre, date, and time slot', color: 'var(--amber-500)' },
  { step: 3, title: 'Visit & Check-In', description: 'Arrive at the centre and scan your token', color: 'var(--info)' },
  { step: 4, title: 'Get Paid', description: 'Quality check, weighing, pricing, and instant payment', color: 'var(--green-600)' },
];

const STATS = [
  { value: '500+', label: 'Procurement Centres' },
  { value: '10K+', label: 'Registered Farmers' },
  { value: '30', label: 'Districts Covered' },
  { value: '₹50Cr+', label: 'Payments Processed' },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />

      {/* ─── Hero ─── */}
      <section
        className="gradient-hero"
        style={{
          padding: '6rem 1.5rem 5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-6rem',
            right: '-6rem',
            width: '20rem',
            height: '20rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4rem',
            left: '-4rem',
            width: '14rem',
            height: '14rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }}
        />

        <div
          className="animate-fade-in-up"
          style={{
            maxWidth: '64rem',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            className="badge"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'var(--green-200)',
              marginBottom: '1.5rem',
              display: 'inline-flex',
            }}
          >
            🇮🇳 Government of Karnataka Initiative
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: '48rem',
              marginBottom: '1.5rem',
            }}
          >
            Smart Agricultural Procurement,{' '}
            <span style={{ color: 'var(--amber-300)' }}>Simplified.</span>
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              color: 'var(--green-200)',
              maxWidth: '36rem',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
            }}
          >
            Book slots, skip the queue, sell your crops at fair prices — all
            from your mobile phone. No middlemen, no delays.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/auth" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>
              Get Started — It&apos;s Free
            </Link>
            <Link href="/centres" className="btn btn-white btn-lg" style={{ textDecoration: 'none' }}>
              Find a Centre
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="section gradient-earth">
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>
              Everything You Need
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              From booking to payment — one platform for the entire procurement journey.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: '2rem',
                  opacity: 0,
                  animation: `fadeInUp 0.6s ease-out ${i * 0.1}s forwards`,
                }}
              >
                <div
                  className="feature-icon"
                  style={{ background: f.color, marginBottom: '1.25rem' }}
                >
                  <span>{f.icon}</span>
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    marginBottom: '0.5rem',
                    color: 'var(--foreground)',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    color: 'var(--muted-foreground)',
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                  }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="section" style={{ background: 'white' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>
              How It Works
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Four simple steps from registration to receiving payment.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '2rem',
            }}
          >
            {STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  opacity: 0,
                  animation: `fadeInUp 0.6s ease-out ${i * 0.12}s forwards`,
                }}
              >
                <div
                  className="step-indicator"
                  style={{
                    background: s.color,
                    color: 'white',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  {s.step}
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    marginBottom: '0.375rem',
                    color: 'var(--foreground)',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color: 'var(--muted-foreground)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                  }}
                >
                  {s.description}
                </p>
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden-on-mobile"
                    style={{
                      position: 'absolute',
                      right: '-1rem',
                      top: '1.5rem',
                      color: 'var(--earth-300)',
                      fontSize: '1.5rem',
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section
        className="gradient-hero"
        style={{ padding: '4rem 1.5rem' }}
      >
        <div
          style={{
            maxWidth: '64rem',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '2rem',
            textAlign: 'center',
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              style={{
                opacity: 0,
                animation: `countUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s forwards`,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 900,
                  color: 'var(--amber-300)',
                  marginBottom: '0.25rem',
                }}
              >
                {s.value}
              </div>
              <div style={{ color: 'var(--green-200)', fontSize: '0.9375rem' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section
        className="section"
        style={{ background: 'white', textAlign: 'center' }}
      >
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          <h2
            className="section-title"
            style={{ marginBottom: '1rem' }}
          >
            Ready to Get Started?
          </h2>
          <p
            className="section-subtitle"
            style={{ margin: '0 auto 2rem' }}
          >
            Join thousands of farmers who are already saving time and getting better
            prices through our platform.
          </p>
          <Link href="/auth" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            Register Now — Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
