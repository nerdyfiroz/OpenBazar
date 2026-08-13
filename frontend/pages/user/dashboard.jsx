import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { useStore } from '../../components/StoreProvider';
import { resolveImageSrc } from '../../utils/resolveImageSrc';
import SmartImage from '../../components/SmartImage';
import SEO from '../../components/SEO';
import PremiumPasswordInput from '../../components/PremiumPasswordInput';
import { getApiBase } from '../../utils/apiBase';

const API_BASE = getApiBase();

const TABS = [
  { key: 'profile', label: '👤 Account Profile' },
  { key: 'wishlist', label: '❤️ My Wishlist' },
  { key: 'security', label: '🔒 Security & Password' }
];

export default function UserDashboard() {
  const router = useRouter();
  const store = useStore() || {};
  const { user, token, login, logout, toggleWishlist, wishlist = [], addToCart } = store;
  const [tab, setTab] = useState('profile');
  const [ordersCount, setOrdersCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const activeToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('ob_token') || localStorage.getItem('token')) : null);
    if (!activeToken) {
      router.push('/login');
      return;
    }
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }

    // Load user orders count
    fetch(`${API_BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${activeToken}` }
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);
        setOrdersCount(list.length);
      })
      .catch(() => {});
  }, [user, token, mounted]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: profile.name, phone: profile.phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      login({ nextUser: { ...user, name: profile.name, phone: profile.phone }, nextToken: token });
      setProfileMsg('✅ Profile updated successfully!');
    } catch (err) {
      setProfileMsg(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg('Password must be at least 6 characters');
      return;
    }
    setSavingPw(true);
    setPwMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      setPwMsg('✅ Password changed successfully! Please login again.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 1500);
    } catch (err) {
      setPwMsg(err.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <MarketplaceLayout>
      <SEO title="My Account — OpenBazar" description="Manage your buyer account and orders." canonical="/user/dashboard" noindex />

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 space-y-6">

        {/* ── Top Executive Profile Header ── */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/40 p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-3xl font-black text-white shadow-lg shadow-indigo-500/25">
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{user?.name || 'My Account'}</h1>
                  <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-indigo-700">
                    {user?.role || 'Buyer'}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <span>✉️ {user?.email}</span>
                  {user?.phone && <span>· 📞 {user.phone}</span>}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/user/orders"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-md shadow-indigo-500/20 hover:scale-105 transition duration-150"
              >
                <span>📦</span>
                <span>My Orders ({ordersCount})</span>
              </Link>
              {user?.role === 'user' && (
                <Link
                  href="/become-seller"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  🏪 Apply as Seller
                </Link>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-indigo-100/60 pt-6">
            <div className="rounded-2xl bg-white/80 p-3.5 border border-slate-100 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders Placed</p>
              <p className="text-xl font-black text-slate-900 mt-1">{ordersCount}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3.5 border border-slate-100 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saved in Wishlist</p>
              <p className="text-xl font-black text-rose-600 mt-1">{wishlist.length}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3.5 border border-slate-100 shadow-xs col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
              <p className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1">
                <span>✓</span> Active & Protected
              </p>
            </div>
          </div>
        </div>

        {/* ── Modern Tabs ── */}
        <div className="flex gap-2 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3.5 px-4 text-xs font-extrabold transition-all ${
                tab === t.key
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Update your contact profile for deliveries and notifications.</p>
            </div>

            <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address (Verified)
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs text-slate-500 cursor-not-allowed"
                  value={profile.email}
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Phone Number
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
                  placeholder="01XXXXXXXXX"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
                <p className="text-[11px] text-slate-400 mt-1">Used as your default contact for parcel deliveries across Bangladesh.</p>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition duration-150 disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
                {profileMsg && <p className="text-xs font-bold text-emerald-600">{profileMsg}</p>}
              </div>
            </form>
          </div>
        )}

        {/* ── Wishlist Tab ── */}
        {tab === 'wishlist' && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">My Saved Wishlist ({wishlist.length})</h2>
                <p className="text-xs text-slate-500 mt-0.5">Items you bookmarked to purchase later.</p>
              </div>
              <Link href="/category" className="text-xs font-bold text-indigo-600 hover:underline">
                Explore More Products →
              </Link>
            </div>

            {!wishlist.length ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-4xl mb-2">🤍</p>
                <p className="text-sm font-bold text-slate-700">Your wishlist is empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Explore top deals on electronics, fashion, and beauty, then tap the heart icon to save.</p>
                <Link
                  href="/category"
                  className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-black text-white shadow"
                >
                  Browse Deals Now
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlist.map((item) => {
                  const img = resolveImageSrc(item.images?.[0] || item.photos?.[0] || item.image);
                  const price = Number(item.discountPrice ?? item.price ?? 0);

                  return (
                    <div key={item._id} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:shadow-md hover:border-indigo-200 transition">
                      <Link href={`/product/${item._id}`}>
                        <div className="relative aspect-square w-full rounded-xl bg-slate-50 overflow-hidden mb-3">
                          <SmartImage
                            src={img}
                            alt={item.name}
                            fill
                            sizes="(max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      </Link>

                      <div>
                        <Link href={`/product/${item._id}`} className="line-clamp-2 text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm font-black text-slate-900">৳{price.toFixed(0)}</p>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => addToCart(item, 1, true)}
                            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-center text-xs font-bold text-white shadow-xs"
                          >
                            Add to Bag
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(item)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                            title="Remove"
                          >
                            ✕
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
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Security & Credentials</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ensure your OpenBazar account is protected with a strong password.</p>
            </div>

            <form onSubmit={changePassword} className="max-w-md space-y-4">
              <div>
                <PremiumPasswordInput
                  id="sec-current-password"
                  label="Current Password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  showStrength={false}
                  required
                  autoComplete="current-password"
                  name="currentPassword"
                />
              </div>

              <div>
                <PremiumPasswordInput
                  id="sec-new-password"
                  label="New Password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  showStrength={true}
                  required
                  autoComplete="new-password"
                  name="newPassword"
                />
              </div>

              <div>
                <PremiumPasswordInput
                  id="sec-confirm-password"
                  label="Confirm New Password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  showStrength={false}
                  required
                  autoComplete="new-password"
                  name="confirmPassword"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingPw}
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black text-white hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {savingPw ? 'Updating...' : 'Update Password'}
                </button>
                {pwMsg && (
                  <p className={`text-xs font-bold ${pwMsg.startsWith('✅') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {pwMsg}
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

      </main>
    </MarketplaceLayout>
  );
}
