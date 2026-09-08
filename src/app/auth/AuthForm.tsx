'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtpAction, verifyOtpAction, registerFarmerAction } from '@/lib/auth/actions';

type AuthStep = 'PHONE' | 'OTP' | 'REGISTER' | 'SUCCESS';

const STEPS: { key: AuthStep; label: string }[] = [
  { key: 'PHONE', label: 'Phone' },
  { key: 'OTP', label: 'Verify' },
  { key: 'REGISTER', label: 'Profile' },
];

export default function AuthForm() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [district, setDistrict] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await sendOtpAction(phone);
    if (res.error) {
      setError(res.error);
    } else {
      setPhone(res.phone!);
      setStep('OTP');
      setMessage('OTP sent! Check your phone.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await verifyOtpAction(phone, otp);
    if (res.error) {
      setError(res.error);
    } else if (res.isNewUser) {
      setStep('REGISTER');
      setMessage('Phone verified! Complete your profile to continue.');
    } else {
      setStep('SUCCESS');
      setMessage('Welcome back!');
      setTimeout(() => router.push('/dashboard'), 1000);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await registerFarmerAction({ full_name: fullName, district });
    if (res.error) {
      setError(res.error);
    } else {
      setStep('SUCCESS');
      setMessage('Registration complete! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1000);
    }
    setLoading(false);
  };

  return (
    <div
      className="glass-card"
      style={{ padding: '2rem', background: 'white' }}
    >
      {/* Step indicator */}
      {step !== 'SUCCESS' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background:
                    i <= currentStepIndex ? 'var(--green-600)' : 'var(--earth-200)',
                  color: i <= currentStepIndex ? 'white' : 'var(--muted-foreground)',
                  transition: 'all 0.3s ease',
                }}
              >
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: '2rem',
                    height: '2px',
                    background:
                      i < currentStepIndex ? 'var(--green-500)' : 'var(--earth-200)',
                    borderRadius: '1px',
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius)',
            color: '#991b1b',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--green-50)',
            border: '1px solid var(--green-200)',
            borderRadius: 'var(--radius)',
            color: 'var(--green-800)',
            fontSize: '0.875rem',
          }}
        >
          {message}
        </div>
      )}

      {/* ─── Phone Step ─── */}
      {step === 'PHONE' && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--foreground)',
                marginBottom: '0.375rem',
              }}
            >
              Mobile Number
            </label>
            <input
              type="tel"
              className="input"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
            />
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.375rem' }}>
              We&apos;ll send a 6-digit OTP to this number
            </p>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? '⏳ Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* ─── OTP Step ─── */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--foreground)',
                marginBottom: '0.375rem',
              }}
            >
              Enter OTP
            </label>
            <input
              type="text"
              className="input"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
              style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
            />
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.375rem' }}>
              Sent to <strong>{phone}</strong>
            </p>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? '⏳ Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: '100%' }}
            onClick={() => { setStep('PHONE'); setOtp(''); setError(null); setMessage(null); }}
          >
            ← Change number
          </button>
        </form>
      )}

      {/* ─── Register Step ─── */}
      {step === 'REGISTER' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--foreground)',
                marginBottom: '0.375rem',
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--foreground)',
                marginBottom: '0.375rem',
              }}
            >
              District
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Bengaluru Rural"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? '⏳ Registering...' : '✅ Complete Registration'}
          </button>
        </form>
      )}

      {/* ─── Success Step ─── */}
      {step === 'SUCCESS' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div
            className="animate-count-up"
            style={{ fontSize: '3rem', marginBottom: '1rem' }}
          >
            ✅
          </div>
          <p style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--green-800)' }}>
            {message || 'Success!'}
          </p>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Redirecting to dashboard...
          </p>
        </div>
      )}
    </div>
  );
}
