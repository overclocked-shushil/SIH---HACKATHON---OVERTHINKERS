import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--green-900)',
        color: 'var(--green-200)',
        padding: '3rem 1.5rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🌾</span>
            Krishi Mitra
          </div>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, opacity: 0.8 }}>
            Digitizing agricultural procurement for a fairer, faster, and
            transparent experience for farmers across Karnataka.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4
            style={{
              color: 'white',
              fontWeight: 700,
              marginBottom: '0.75rem',
              fontSize: '0.9375rem',
            }}
          >
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { href: '/', label: 'Home' },
              { href: '/centres', label: 'Find a Centre' },
              { href: '/auth', label: 'Login' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: 'var(--green-300)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  transition: 'color 0.2s',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4
            style={{
              color: 'white',
              fontWeight: 700,
              marginBottom: '0.75rem',
              fontSize: '0.9375rem',
            }}
          >
            Contact
          </h4>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.875rem',
              opacity: 0.8,
            }}
          >
            <span>📞 1800-XXX-XXXX (Toll Free)</span>
            <span>📧 help@krishimitra.gov.in</span>
            <span>📍 Bengaluru, Karnataka</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: '80rem',
          margin: '2rem auto 0',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          opacity: 0.7,
        }}
      >
        <span>© {new Date().getFullYear()} Krishi Mitra. Government of Karnataka.</span>
        <span>Built for Smart India Hackathon</span>
      </div>
    </footer>
  );
}
