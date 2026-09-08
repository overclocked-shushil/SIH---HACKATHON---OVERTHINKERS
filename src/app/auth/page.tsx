import AuthForm from './AuthForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Login | Krishi Mitra',
  description: 'Login or register using your mobile number to access the Smart Agricultural Procurement system.',
};

export default function AuthPage() {
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
          className="animate-fade-in-up"
          style={{ width: '100%', maxWidth: '26rem' }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌾</div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--green-800)',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome to Krishi Mitra
            </h1>
            <p
              style={{
                color: 'var(--muted-foreground)',
                fontSize: '0.9375rem',
                marginTop: '0.375rem',
              }}
            >
              Login or register using your mobile number
            </p>
          </div>

          <AuthForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
