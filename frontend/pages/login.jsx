import { useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function Login() {
  const router = useRouter();
  const { login } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'user' });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      if (isLogin) {
        login({ nextUser: data.user, nextToken: data.token });
        setMessage(`Welcome back, ${data.user.name}! Redirecting...`);
        
        setTimeout(() => {
          if (data.user.role === 'admin') router.push('/admin/dashboard');
          else if (data.user.role === 'seller') router.push('/seller/dashboard');
          else router.push('/user/dashboard');
        }, 900);
      } else {
        setMessage(data.message || 'Registration successful. Please login now.');
        setIsLogin(true);
      }
    } catch (error) {
      setMessage(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black">{isLogin ? 'Login to OpenBazar' : 'Create Account'}</h1>
          <p className="mt-1 text-sm text-slate-500">{isLogin ? 'Welcome back, smart shopper!' : 'Join as buyer or seller.'}</p>

          {message && <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm">{message}</p>}

          <form onSubmit={submit} className="mt-4 space-y-3">
            {!isLogin && (
              <>
                <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                <input className="input" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
                <select className="input" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                  <option value="user">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </>
            )}

            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70">
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <button className="mt-3 text-sm text-orange-500 underline" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
      </main>
    </MarketplaceLayout>
  );
}
