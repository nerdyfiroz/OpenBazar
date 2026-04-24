import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { login } = useStore();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(true);
  const [linkChecked, setLinkChecked] = useState(false);

  const redirectByRole = (userRole) => {
    if (userRole === 'admin') router.push('/admin/dashboard');
    else if (userRole === 'seller') router.push('/seller/dashboard');
    else router.push('/user/dashboard');
  };

  useEffect(() => {
    if (!router.isReady) return;

    const queryEmail = typeof router.query.email === 'string' ? router.query.email : '';
    const queryToken = typeof router.query.token === 'string' ? router.query.token : '';

    if (queryEmail) setEmail(queryEmail);

    const verifyByLink = async () => {
      if (!queryEmail || !queryToken) {
        setAutoVerifying(false);
        setLinkChecked(true);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/verify-email-link?email=${encodeURIComponent(queryEmail)}&token=${encodeURIComponent(queryToken)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Verification link failed');

        login({ nextUser: data.user, nextToken: data.token });
        setMessage('Email verified successfully. Redirecting...');
        setLinkChecked(true);
        setTimeout(() => redirectByRole(data.user.role), 900);
      } catch (err) {
        setMessage(err.message || 'Verification link is invalid or expired. Please use OTP below.');
        setLinkChecked(true);
      } finally {
        setAutoVerifying(false);
      }
    };

    verifyByLink();
  }, [router.isReady, router.query.email, router.query.token]);

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'OTP verification failed');

      login({ nextUser: data.user, nextToken: data.token });
      setMessage('Email verified successfully. Redirecting...');
      setTimeout(() => redirectByRole(data.user.role), 900);
    } catch (err) {
      setMessage(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email) {
      setMessage('Please enter your email first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      setMessage(data.message || 'OTP resent. Check your email.');
    } catch (err) {
      setMessage(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black">Verify Your Email</h1>
          <p className="mt-1 text-sm text-slate-500">Use the OTP code from your inbox, or just click the one-time email link.</p>

          {autoVerifying && <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm">Checking verification link...</p>}
          {message && <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm">{message}</p>}

          {linkChecked && (
            <form onSubmit={verifyOtp} className="mt-4 space-y-3">
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

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70">
                {loading ? 'Please wait...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={resendOtp}
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
