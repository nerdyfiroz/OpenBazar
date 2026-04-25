import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const StoreContext = createContext(null);
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const COUPONS = {
  MEGA10: { discountPercent: 10, title: 'Mega Style 10% Off' },
  EID150: { flat: 150, title: 'Eid Campaign ৳150 Off' }
};

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedUser = localStorage.getItem('ob_user');
    const savedToken = localStorage.getItem('ob_token') || localStorage.getItem('token');
    const savedCart = localStorage.getItem('ob_cart');
    const savedWishlist = localStorage.getItem('ob_wishlist');
    const savedCoupon = localStorage.getItem('ob_coupon');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedToken) setToken(savedToken);
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedCoupon) setCoupon(JSON.parse(savedCoupon));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ob_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ob_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (!token) return;

    const syncWishlist = async () => {
      try {
        const localWishlistRaw = typeof window !== 'undefined' ? localStorage.getItem('ob_wishlist') : '[]';
        const localWishlist = JSON.parse(localWishlistRaw || '[]');

        await Promise.all(
          localWishlist.map((item) => fetch(`${API_BASE}/auth/wishlist/${item._id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          }))
        );

        const res = await fetch(`${API_BASE}/auth/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setWishlist(Array.isArray(data) ? data : []);
      } catch {
        // silent fallback
      }
    };

    syncWishlist();
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (coupon) localStorage.setItem('ob_coupon', JSON.stringify(coupon));
    else localStorage.removeItem('ob_coupon');
  }, [coupon]);

  const login = ({ nextUser, nextToken }) => {
    setUser(nextUser);
    setToken(nextToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ob_user', JSON.stringify(nextUser));
      localStorage.setItem('ob_token', nextToken);
      localStorage.setItem('token', nextToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setCart([]);
    setWishlist([]);
    setCoupon(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ob_user');
      localStorage.removeItem('ob_token');
      localStorage.removeItem('token');
      localStorage.removeItem('ob_coupon');
      localStorage.removeItem('ob_cart');
    }
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) => (
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
      }

      const effectivePrice = product.discountPrice ?? product.price;
      return [...prev, { ...product, unitPrice: effectivePrice, quantity }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item._id !== productId));
      return;
    }

    setCart((prev) => prev.map((item) => (
      item._id === productId ? { ...item, quantity } : item
    )));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  const toggleWishlist = (product) => {
    const found = wishlist.some((item) => item._id === product._id);

    if (token) {
      const method = found ? 'DELETE' : 'POST';
      fetch(`${API_BASE}/auth/wishlist/${product._id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.wishlist)) {
            setWishlist(data.wishlist);
          }
        })
        .catch(() => {});
      return;
    }

    setWishlist((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      if (exists) return prev.filter((item) => item._id !== product._id);
      return [...prev, product];
    });
  };

  const applyCoupon = (code) => {
    const normalized = code.toUpperCase().trim();
    const next = COUPONS[normalized];
    if (!next) return { ok: false, message: 'Invalid coupon code' };
    setCoupon({ code: normalized, ...next });
    return { ok: true, message: `${normalized} applied` };
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);

  const couponDiscount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discountPercent) return (subtotal * coupon.discountPercent) / 100;
    if (coupon.flat) return Math.min(coupon.flat, subtotal);
    return 0;
  }, [coupon, subtotal]);

  const value = {
    user,
    token,
    cart,
    wishlist,
    coupon,
    subtotal,
    couponDiscount,
    login,
    logout,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleWishlist,
    applyCoupon,
    clearCoupon: () => setCoupon(null)
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
