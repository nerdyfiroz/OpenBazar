import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const queryEmail = typeof router.query.email === 'string' ? router.query.email : '';
    if (queryEmail) setEmail(queryEmail);
  }, [router.isReady, router.query.email]);

  const readResponse = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }

    const text = await res.text();
    return { message: text || 'Request failed' };
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await readResponse(res);

      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

      setOtpSent(true);
      setMessage(data.message || 'Password reset OTP sent. Check your email.');
    } catch (err) {
      setMessage(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword
        })
      });
      const data = await readResponse(res);

      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      setMessage(data.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1000);
    } catch (err) {
      setMessage(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black">Reset Your Password</h1>
          <p className="mt-1 text-sm text-slate-500">We’ll verify your email with an OTP, then let you set a new password.</p>

          {message && <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm">{message}</p>}

          {!otpSent ? (
            <form onSubmit={requestOtp} className="mt-4 space-y-3">
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70"
              >
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="mt-4 space-y-3">
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={requestOtp}
                disabled={loading}
                className="w-full rounded-xl border border-orange-500 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-70"
              >
                Resend OTP
              </button>
            </form>
          )}

          <button className="mt-3 text-sm text-orange-500 underline" onClick={() => router.push('/login')}>
            Back to Login
          </button>
        </div>
      </main>
    </MarketplaceLayout>
  );
}
