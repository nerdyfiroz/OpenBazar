import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { useStore } from '../../components/StoreProvider';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const TABS = [
  { key: 'profile', label: '👤 Profile' },
  { key: 'wishlist', label: '❤️ Wishlist' },
  { key: 'security', label: '🔒 Security' }
];

export default function UserDashboard() {
  const router = useRouter();
  const { user, token, login, logout, toggleWishlist, wishlist } = useStore();
  const [tab, setTab] = useState('profile');

  // Profile form
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    if (user) setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user, token]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true); setProfileMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name, phone: profile.phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      login({ nextUser: { ...user, name: profile.name, phone: profile.phone }, nextToken: token });
      setProfileMsg('✅ Profile updated successfully!');
    } catch (err) { setProfileMsg(err.message || 'Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { setPwMsg('Password must be at least 6 characters'); return; }
    setSavingPw(true); setPwMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPwMsg('✅ Password changed! Please login again.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { logout(); router.push('/login'); }, 2000);
    } catch (err) { setPwMsg(err.message || 'Failed'); }
    finally { setSavingPw(false); }
  };

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-2xl font-black text-white">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user?.name || 'My Account'}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link href="/user/orders" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              📦 My Orders
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition ${tab === t.key ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Personal Information</h2>
            <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Full Name</span>
                <input className="input" value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Email (read-only)</span>
                <input className="input bg-slate-50 cursor-not-allowed" value={profile.email} readOnly />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Phone Number</span>
                <input className="input" placeholder="01XXXXXXXXX" value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </label>
              <div className="md:col-span-2 flex items-center gap-3">
                <button type="submit" disabled={savingProfile}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
              </div>
            </form>

            {/* Account info */}
            <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Role</p>
                <p className="mt-0.5 font-semibold capitalize">{user?.role || 'Buyer'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Member Since</p>
                <p className="mt-0.5 font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Wishlist Items</p>
                <p className="mt-0.5 font-semibold">{wishlist.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Wishlist Tab ── */}
        {tab === 'wishlist' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">My Wishlist ({wishlist.length})</h2>
            {!wishlist.length ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-4xl">🤍</p>
                <p className="mt-3">Your wishlist is empty.</p>
                <Link href="/category" className="mt-4 inline-block rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlist.map((item) => {
                  const img = resolveImageSrc(item.images?.[0] || item.photos?.[0]);
                  const price = Number(item.discountPrice ?? item.price ?? 0);
                  return (
                    <div key={item._id} className="overflow-hidden rounded-xl border border-slate-200">
                      <Link href={`/product/${item._id}`}>
                        <img src={img} alt={item.name} className="h-36 w-full object-cover hover:opacity-90 transition"
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} />
                      </Link>
                      <div className="p-3">
                        <Link href={`/product/${item._id}`} className="line-clamp-2 text-sm font-semibold hover:text-orange-600">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-lg font-black text-orange-600">৳{price.toFixed(0)}</p>
                        <div className="mt-2 flex gap-2">
                          <Link href={`/product/${item._id}`}
                            className="flex-1 rounded-lg bg-orange-500 px-3 py-1.5 text-center text-xs font-bold text-white hover:bg-orange-600">
                            View
                          </Link>
                          <button onClick={() => toggleWishlist(item)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Security Tab ── */}
        {tab === 'security' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Change Password</h2>
            <form onSubmit={changePassword} className="grid max-w-md gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Current Password</span>
                <input type="password" className="input" value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">New Password</span>
                <input type="password" className="input" value={pwForm.newPassword} minLength={6}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</span>
                <input type="password" className="input" value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} required />
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingPw}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
                  {savingPw ? 'Changing...' : 'Change Password'}
                </button>
                {pwMsg && <p className={`text-sm ${pwMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{pwMsg}</p>}
              </div>
            </form>
          </div>
        )}
      </main>
    </MarketplaceLayout>
  );
}
