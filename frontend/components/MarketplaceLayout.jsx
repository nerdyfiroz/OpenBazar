import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from './StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function MarketplaceLayout({ children }) {
  const router = useRouter();
  const { cart, user, logout } = useStore();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!search.trim()) { setSuggestions([]); return; }
      try {
        const res = await fetch(`${API_BASE}/products/suggestions?q=${encodeURIComponent(search.trim())}`);
        if (!res.ok) return;
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  // Close menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [router.asPath]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const submitSearch = (e) => {
    e.preventDefault();
    router.push(`/category?q=${encodeURIComponent(search)}`);
    setSuggestions([]);
    setSearch('');
  };

  const getDashboardHref = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'seller') return '/seller/dashboard';
    return '/user/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img src="/api/logo" alt="OpenBazar" className="h-12 w-auto object-contain md:h-16" />
          </Link>

          {/* Search — hidden on very small mobile, shown from sm */}
          <form onSubmit={submitSearch} className="relative hidden flex-1 sm:block">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full rounded-full border border-orange-200 px-4 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSuggestions([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
            )}
            {suggestions.length > 0 && (
              <div className="absolute mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                {suggestions.map((item) => (
                  <button type="button" key={item._id}
                    onClick={() => { router.push(`/product/${item._id}`); setSuggestions([]); setSearch(''); }}
                    className="block w-full rounded-lg px-4 py-2.5 text-left text-sm hover:bg-orange-50">
                    🔍 {item.name}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-2 text-sm md:flex md:gap-3">
            {!user ? (
              <Link href="/login" className="rounded-full border border-orange-200 px-3 py-1.5 font-semibold hover:bg-orange-50">Login / Signup</Link>
            ) : (
              <>
                {user.role === 'user' && (
                  <Link href="/become-seller" className="rounded-full border border-orange-200 px-3 py-1.5 hover:bg-orange-50">Sell</Link>
                )}
                <Link href={getDashboardHref()} className="rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-100 max-w-[120px] truncate" title={user.name}>{user.name}</Link>
                <button onClick={() => { logout(); router.push('/'); }}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">Logout</button>
              </>
            )}
            <Link href="/cart" className="relative rounded-full bg-orange-500 px-3 py-1.5 text-white hover:bg-orange-600">
              🛒 <span className="ml-0.5">{cartCount}</span>
            </Link>
          </nav>

          {/* Mobile: cart + hamburger */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Link href="/cart" className="relative rounded-full bg-orange-500 px-3 py-1.5 text-sm text-white">
              🛒 {cartCount}
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100">
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="border-t border-slate-100 px-3 pb-2 pt-1 sm:hidden">
          <form onSubmit={submitSearch} className="relative">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-orange-200 px-4 py-2 text-sm outline-none focus:ring focus:ring-orange-300" />
            {suggestions.length > 0 && (
              <div className="absolute mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                {suggestions.map((item) => (
                  <button type="button" key={item._id}
                    onClick={() => { router.push(`/product/${item._id}`); setSuggestions([]); setSearch(''); }}
                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50">
                    🔍 {item.name}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Mobile slide-out menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1 text-sm">
              {!user ? (
                <Link href="/login" className="rounded-xl bg-orange-500 px-4 py-3 text-center font-semibold text-white">Login / Signup</Link>
              ) : (
                <>
                  <Link href={getDashboardHref()} className="rounded-xl border border-slate-200 px-4 py-3 font-semibold">
                    👤 {user.name}
                  </Link>
                  <Link href="/user/orders" className="rounded-xl border border-slate-100 px-4 py-2.5">📦 My Orders</Link>
                  <Link href="/user/dashboard?tab=wishlist" className="rounded-xl border border-slate-100 px-4 py-2.5">❤️ Wishlist</Link>
                  {user.role === 'user' && (
                    <Link href="/become-seller" className="rounded-xl border border-slate-100 px-4 py-2.5">🏪 Become a Seller</Link>
                  )}
                  <button onClick={() => { logout(); router.push('/'); }}
                    className="mt-1 rounded-xl bg-slate-900 px-4 py-3 text-left font-semibold text-white">
                    Logout
                  </button>
                </>
              )}
              <hr className="my-2" />
              <Link href="/category" className="px-4 py-2 text-slate-600">All Products</Link>
              <Link href="/category?category=Electronics" className="px-4 py-2 text-slate-600">📱 Electronics</Link>
              <Link href="/category?category=Fashion" className="px-4 py-2 text-slate-600">👗 Fashion</Link>
              <Link href="/category?category=Beauty" className="px-4 py-2 text-slate-600">💄 Beauty</Link>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div>
            <h3 className="text-lg font-bold text-orange-500">OpenBazar</h3>
            <p className="mt-2 text-sm text-slate-600">Bangladesh-first marketplace for electronics, fashion, groceries and more.</p>
            <p className="mt-2 text-sm font-semibold text-orange-600">
              <a href="mailto:support@open-bazar.me">support@open-bazar.me</a>
            </p>
            <p className="mt-3 text-xs text-slate-400">📍 Dhaka, Bangladesh</p>
          </div>
          <FooterColumn title="Company" links={[['About', '/about'], ['Contact', '/contact'], ['Terms', '/terms'], ['Privacy', '/privacy-policy']]} />
          <FooterColumn title="Customer Care" links={[['My Orders', '/user/orders'], ['Wishlist', '/user/dashboard'], ['Track Order', '/user/orders'], ['Checkout', '/checkout']]} />
          <div>
            <h4 className="mb-2 font-semibold">Follow Us</h4>
            <div className="flex gap-3 text-xl">
              <a href="#" className="hover:opacity-70">📘</a>
              <a href="#" className="hover:opacity-70">📸</a>
              <a href="#" className="hover:opacity-70">▶️</a>
              <a href="#" className="hover:opacity-70">🎵</a>
            </div>
            <p className="mt-4 text-xs text-slate-400">© 2026 OpenBazar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="mb-2 font-semibold">{title}</h4>
      <ul className="space-y-1 text-sm text-slate-600">
        {links.map(([label, href]) => (
          <li key={label}><Link href={href} className="hover:text-orange-500">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
