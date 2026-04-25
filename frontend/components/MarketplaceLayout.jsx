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

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!search.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/products/suggestions?q=${encodeURIComponent(search.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const submitSearch = (event) => {
    event.preventDefault();
    router.push(`/category?q=${encodeURIComponent(search)}`);
    setSuggestions([]);
  };

  const getDashboardHref = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'seller') return '/seller/dashboard';
    return '/user/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-3 py-3 md:px-6">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/api/logo"
              alt="OpenBazar"
              className="h-16 w-auto max-w-[300px] object-contain md:h-18"
            />
          </Link>

          <form onSubmit={submitSearch} className="relative min-w-[220px] flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full rounded-full border border-orange-200 px-4 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
            />
            {Boolean(suggestions.length) && (
              <div className="absolute mt-1 w-full rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {suggestions.map((item) => (
                  <button
                    type="button"
                    key={item._id}
                    onClick={() => {
                      router.push(`/product/${item._id}`);
                      setSuggestions([]);
                      setSearch('');
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </form>

          <nav className="ml-auto flex items-center gap-2 text-sm md:gap-3">
            {!user ? (
              <Link href="/login" className="rounded-full border border-orange-200 px-3 py-1.5 hover:bg-orange-50">Login / Signup</Link>
            ) : (
              <>
                {user.role === 'user' && (
                  <Link href="/become-seller" className="rounded-full border border-orange-200 px-3 py-1.5 hover:bg-orange-50">Become Seller</Link>
                )}
                <Link href={getDashboardHref()} className="rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-100">{user.name}</Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            )}
            <Link href="/cart" className="rounded-full bg-orange-500 px-3 py-1.5 text-white hover:bg-orange-600">Cart ({cartCount})</Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div>
            <h3 className="text-lg font-bold text-orange-500">OpenBazar</h3>
            <p className="mt-2 text-sm text-slate-600">Bangladesh-first marketplace for electronics, fashion, groceries and more.</p>
          </div>
          <FooterColumn title="Company" links={[['About', '/about'], ['Contact', '/contact'], ['Terms', '/terms'], ['Privacy', '/privacy-policy']]} />
          <FooterColumn title="Customer Care" links={[['My Orders', '/user/orders'], ['Wishlist', '/user/dashboard'], ['Checkout', '/checkout']]} />
          <div>
            <h4 className="mb-2 font-semibold">Follow Us</h4>
            <p className="text-sm text-slate-600">Facebook · Instagram · YouTube · TikTok</p>
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
          <li key={label}>
            <Link href={href} className="hover:text-orange-500">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
