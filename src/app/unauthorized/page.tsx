import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Unauthorized | Krishi Mitra',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <main
        className="gradient-earth"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
        }}
      >
        <div
          className="glass-card animate-fade-in-up"
          style={{
            padding: '3rem 2.5rem',
            textAlign: 'center',
            maxWidth: '28rem',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--foreground)',
              marginBottom: '0.75rem',
            }}
          >
            Access Denied
          </h1>
          <p
            style={{
              color: 'var(--muted-foreground)',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}
          >
            You don&apos;t have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/dashboard"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="btn btn-outline"
              style={{ textDecoration: 'none' }}
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
