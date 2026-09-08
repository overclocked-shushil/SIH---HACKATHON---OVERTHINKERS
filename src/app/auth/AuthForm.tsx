'use client';

import { useState } from 'react';
import { sendOtpAction, verifyOtpAction, registerFarmerAction } from '@/lib/auth/actions';

type AuthStep = 'PHONE' | 'OTP' | 'REGISTER' | 'SUCCESS';

export default function AuthForm() {
  const [step, setStep] = useState<AuthStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [district, setDistrict] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await sendOtpAction(phone);
    if (res.error) {
      setError(res.error);
    } else {
      setPhone(res.phone!); // Use normalized phone
      setStep('OTP');
      setMessage('OTP sent successfully. Please check your phone.');
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
      setMessage('Phone verified. Please complete your farmer profile.');
    } else {
      setStep('SUCCESS');
      setMessage(`Logged in successfully. Role: ${res.role}`);
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
      setMessage('Registration complete! Logged in as FARMER.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Authentication Testing</h2>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{message}</div>}

      {step === 'PHONE' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      {step === 'REGISTER' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      )}

      {step === 'SUCCESS' && (
        <div className="text-center p-4">
          <p className="text-gray-700">Auth flow completed successfully.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Reset Test
          </button>
        </div>
      )}
    </div>
  );
}
