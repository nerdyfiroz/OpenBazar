import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { resolveImageSrc } from '../../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [sellerApplications, setSellerApplications] = useState([]);
  const [badgeRequests, setBadgeRequests] = useState([]);
  const [verificationFee, setVerificationFee] = useState(0);
  const [flashSale, setFlashSale] = useState(null);
  const [flashSaleTimer, setFlashSaleTimer] = useState('');
  const [flashSaleApps, setFlashSaleApps] = useState([]);
  const [flashAppFilter, setFlashAppFilter] = useState('pending');
  const [coupons, setCoupons] = useState([]);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrderAmount: 0,
    maxDiscount: '',
    usageLimit: '',
    minItemCount: '',
    perUserLimit: '',
    maxUsers: '',
    startsAt: '',
    expiresAt: '',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, []);

  const normalizeList = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload[key])) return payload[key];
    return [];
  };

  const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const resetCouponForm = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      type: 'percentage',
      value: '',
      minOrderAmount: 0,
      maxDiscount: '',
      usageLimit: '',
      minItemCount: '',
      perUserLimit: '',
      maxUsers: '',
      startsAt: '',
      expiresAt: '',
      isActive: true
    });
  };

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      setMessage('Admin token not found. Please login as admin.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const fetchJson = async (url, options = {}) => {
        try {
          const res = await fetch(url, options);
          if (!res.ok) return { ok: false, data: null };
          const data = await res.json();
          return { ok: true, data };
        } catch {
          return { ok: false, data: null };
        }
      };

      const [dashRes, productRes, orderRes, userRes, sellerAppRes, badgeReqRes, feeRes, flashSaleRes, couponRes, flashAppsRes] = await Promise.all([
        fetchJson(`${API_BASE}/dashboard/admin`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/products/admin/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/orders/admin/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/auth/admin/seller-applications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/auth/admin/seller-verification-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/auth/admin/seller-verification-fee`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/dashboard/flash-sale`),
        fetchJson(`${API_BASE}/coupons/admin/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchJson(`${API_BASE}/flash-sale/admin/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const failedSections = [];

      if (!dashRes.ok) failedSections.push('dashboard overview');
      if (!productRes.ok) failedSections.push('products');
      if (!orderRes.ok) failedSections.push('orders');
      if (!userRes.ok) failedSections.push('users');
      if (!sellerAppRes.ok) failedSections.push('seller applications');
      if (!badgeReqRes.ok) failedSections.push('badge requests');
      if (!feeRes.ok) failedSections.push('verification fee');
      if (!flashSaleRes.ok) failedSections.push('flash sale');
      if (!couponRes.ok) failedSections.push('coupons');

      setDashboard(dashRes.data || {
        totalOrders: 0,
        totalSellers: 0,
        totalProducts: 0,
        totalSales: 0,
        totalProductsSold: 0,
        totalVisitors: 0,
        totalCommission: 0,
        topSellingProducts: []
      });
      setProducts(normalizeList(productRes.data, 'products'));
      setOrders(normalizeList(orderRes.data, 'orders'));
      setUsers(normalizeList(userRes.data, 'users'));
      setSellerApplications(normalizeList(sellerAppRes.data, 'users'));
      setBadgeRequests(normalizeList(badgeReqRes.data, 'users'));
      setVerificationFee(Number(feeRes.data?.fee || 0));
      setFlashSale(flashSaleRes.data || { status: 'inactive', count: 0, nextEndsAt: null });
      if (flashSaleRes.data?.nextEndsAt) {
        setFlashSaleTimer(toDateTimeLocal(flashSaleRes.data.nextEndsAt));
      }
      setCoupons(Array.isArray(couponRes.data) ? couponRes.data : []);
      setFlashSaleApps(Array.isArray(flashAppsRes.data?.applications) ? flashAppsRes.data.applications : []);

      if (failedSections.length) {
        setMessage(`Some sections failed to load: ${failedSections.join(', ')}.`);
      }
    } catch (err) {
      setMessage(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProduct = async (productId, updates) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/products/admin/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Product update failed');
      }

      setProducts((prev) => (Array.isArray(prev) ? prev.map((p) => (p._id === productId ? data.product : p)) : []));
      setMessage('Product updated successfully');
      fetchData();
    } catch (err) {
      setMessage(err.message || 'Product update failed');
    }
  };

  const onProductFieldChange = (productId, field, value) => {
    setProducts((prev) => (Array.isArray(prev) ? prev.map((p) => (p._id === productId ? { ...p, [field]: value } : p)) : []));
  };

  const updateOrderStatus = async (orderId, status) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, note: statusNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setOrders((prev) => (Array.isArray(prev) ? prev.map((o) => (o._id === orderId ? data.order : o)) : []));
      setMessage('Order updated');
    } catch (err) {
      setMessage(err.message || 'Order update failed');
    }
  };

  const deleteProduct = async (productId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/products/admin/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Product delete failed');
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setMessage('Seller post deleted successfully');
    } catch (err) {
      setMessage(err.message || 'Product delete failed');
    }
  };

  const reviewSellerApplication = async (userId, status) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/admin/seller-applications/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to review seller application');
      setMessage(data.message || 'Seller application reviewed');
      fetchData();
    } catch (err) {
      setMessage(err.message || 'Failed to review seller application');
    }
  };

  const updateVerificationFee = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/admin/seller-verification-fee`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(verificationFee || 0) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update verification fee');
      setVerificationFee(Number(data.fee || 0));
      setMessage('Verified badge subscription fee updated');
      fetchData();
    } catch (err) {
      setMessage(err.message || 'Failed to update verification fee');
    }
  };

  const reviewVerifiedBadge = async (userId, action, waiveFee = false) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/admin/sellers/${userId}/verified-badge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, waiveFee })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update verified badge');
      setMessage('Verified badge status updated');
      fetchData();
    } catch (err) {
      setMessage(err.message || 'Failed to update verified badge');
    }
  };

  const toggleBlockUser = async (userId, isBlocked) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isBlocked })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'User update failed');
      setUsers((prev) => (Array.isArray(prev) ? prev.map((u) => (u._id === userId ? { ...u, isBlocked: data.user.isBlocked } : u)) : []));
      setMessage('User status updated');
    } catch (err) {
      setMessage(err.message || 'User update failed');
    }
  };

  const onCouponFormChange = (field, value) => {
    setCouponForm((prev) => ({ ...prev, [field]: value }));
  };

  const onAdminFormChange = (field, value) => {
    setAdminForm((prev) => ({ ...prev, [field]: value }));
  };

  const createAdmin = async () => {
    if (!token) return;

    setCreatingAdmin(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: adminForm.name,
          email: adminForm.email,
          phone: adminForm.phone,
          password: adminForm.password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const validationMessage = Array.isArray(data.errors) && data.errors.length
          ? data.errors[0].msg
          : null;
        throw new Error(validationMessage || data.message || 'Failed to create admin');
      }

      setMessage(data.message || 'New admin created successfully');
      setAdminForm({ name: '', email: '', phone: '', password: '' });
      fetchData();
    } catch (err) {
      setMessage(err.message || 'Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const submitCoupon = async () => {
    if (!token) return;

    const payload = {
      code: couponForm.code,
      type: couponForm.type,
      value: Number(couponForm.value || 0),
      minOrderAmount: Number(couponForm.minOrderAmount || 0),
      maxDiscount: couponForm.maxDiscount === '' ? null : Number(couponForm.maxDiscount),
      usageLimit: couponForm.usageLimit === '' ? null : Number(couponForm.usageLimit),
      minItemCount: couponForm.minItemCount === '' ? 0 : Number(couponForm.minItemCount),
      perUserLimit: couponForm.perUserLimit === '' ? null : Number(couponForm.perUserLimit),
      maxUsers: couponForm.maxUsers === '' ? null : Number(couponForm.maxUsers),
      startsAt: couponForm.startsAt || undefined,
      expiresAt: couponForm.expiresAt || undefined,
      isActive: Boolean(couponForm.isActive)
    };

    try {
      const endpoint = editingCouponId
        ? `${API_BASE}/coupons/admin/${editingCouponId}`
        : `${API_BASE}/coupons/admin`;
      const method = editingCouponId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save coupon');

      setMessage(editingCouponId ? 'Coupon updated successfully' : 'Coupon created successfully');
      resetCouponForm();
      fetchData();
    } catch (err) {
      setMessage(err.message || 'Failed to save coupon');
    }
  };

  const startEditCoupon = (coupon) => {
    setEditingCouponId(coupon._id);
    setCouponForm({
      code: coupon.code || '',
      type: coupon.type || 'percentage',
      value: coupon.value ?? '',
      minOrderAmount: coupon.minOrderAmount ?? 0,
      maxDiscount: coupon.maxDiscount ?? '',
      usageLimit: coupon.usageLimit ?? '',
      minItemCount: coupon.minItemCount ?? '',
      perUserLimit: coupon.perUserLimit ?? '',
      maxUsers: coupon.maxUsers ?? '',
      startsAt: toDateTimeLocal(coupon.startsAt),
      expiresAt: toDateTimeLocal(coupon.expiresAt),
      isActive: Boolean(coupon.isActive)
    });
  };

  const toggleCouponStatus = async (couponId, isActive) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/coupons/admin/${couponId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update coupon status');

      setCoupons((prev) => prev.map((c) => (c._id === couponId ? data.coupon : c)));
      setMessage('Coupon status updated');
    } catch (err) {
      setMessage(err.message || 'Failed to update coupon status');
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/coupons/admin/${couponId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete coupon');

      setCoupons((prev) => prev.filter((c) => c._id !== couponId));
      setMessage('Coupon deleted');
      if (editingCouponId === couponId) resetCouponForm();
    } catch (err) {
      setMessage(err.message || 'Failed to delete coupon');
    }
  };

  const adminReviewFlashApp = async (appId, action, adminNote = '') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/flash-sale/admin/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, adminNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Action failed');
      setMessage(data.message || `Application ${action}d`);
      // Update local state
      setFlashSaleApps((prev) => prev.map((a) =>
        a._id === appId ? { ...a, status: action === 'approve' ? 'approved' : 'rejected', adminNote } : a
      ));
    } catch (err) {
      setMessage(err.message || 'Failed to review application');
    }
  };

  const updateGlobalFlashSaleTimer = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/dashboard/admin/flash-sale/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endsAt: flashSaleTimer || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update flash sale timer');
      setMessage('Global flash sale timer updated');
      fetchData();
    } catch (err) {
      setMessage(err.message || 'Failed to update flash sale timer');
    }
  };

  return (
    <MarketplaceLayout>
      <main className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {message && (
        <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {message}
        </p>
      )}

      {loading && <p>Loading dashboard...</p>}

      {!loading && dashboard && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Visitors" value={dashboard.totalVisitors} />
            <StatCard label="Total Orders" value={dashboard.totalOrders} />
            <StatCard label="Total Products" value={dashboard.totalProducts} />
            <StatCard label="Products Sold" value={dashboard.totalProductsSold} />
            <StatCard label="Total Sales" value={`৳${Number(dashboard.totalSales || 0).toFixed(2)}`} />
            <StatCard label="Total Sellers" value={dashboard.totalSellers} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Top Selling Products</h2>
            {!dashboard.topSellingProducts?.length ? (
              <p className="text-sm text-gray-500">No sales data yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {dashboard.topSellingProducts.map((item) => (
                  <li key={item.productId} className="flex justify-between border-b pb-2">
                    <span>{item.name}</span>
                    <span className="font-medium">Sold: {item.soldQuantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Manage Product Listings & Prices</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Seller</th>
                  <th className="py-2 pr-3">Sale Type</th>
                  <th className="py-2 pr-3">Base Price</th>
                  <th className="py-2 pr-3">Sale %</th>
                  <th className="py-2 pr-3">Sale Price</th>
                  <th className="py-2 pr-3">Sale Start</th>
                  <th className="py-2 pr-3">Sale End</th>
                  <th className="py-2 pr-3">Approved</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b align-top">
                    <td className="py-2 pr-3 font-medium">{p.name}</td>
                    <td className="py-2 pr-3">{p.seller?.name || 'N/A'}</td>
                    <td className="py-2 pr-3">
                      <select
                        className="w-32 rounded border px-2 py-1"
                        value={p.saleType || 'regular'}
                        onChange={(e) => onProductFieldChange(p._id, 'saleType', e.target.value)}
                      >
                        <option value="regular">Regular</option>
                        <option value="sale">Flash Sale</option>
                        <option value="preorder">Preorder</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-24 border rounded px-2 py-1"
                        type="number"
                        min="0"
                        value={p.price ?? 0}
                        onChange={(e) => onProductFieldChange(p._id, 'price', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-24 border rounded px-2 py-1"
                        type="number"
                        min="0"
                        max="100"
                        value={p.salePercent ?? 0}
                        onChange={(e) => {
                          const newSalePercent = e.target.value === '' ? 0 : Number(e.target.value);
                          const basePrice = Number(p.price) || 0;
                          onProductFieldChange(p._id, 'salePercent', newSalePercent);
                          // Auto-calculate discount price: Sale Price = Base Price * (1 - Discount%)
                          if (newSalePercent > 0 && basePrice > 0) {
                            const calculatedDiscount = Number((basePrice * (1 - newSalePercent / 100)).toFixed(2));
                            console.log(`Auto-calc: ${basePrice} * (1 - ${newSalePercent}/100) = ${calculatedDiscount}`);
                            onProductFieldChange(p._id, 'discountPrice', calculatedDiscount);
                          } else {
                            onProductFieldChange(p._id, 'discountPrice', null);
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-24 border rounded px-2 py-1"
                        type="number"
                        min="0"
                        value={p.discountPrice ?? ''}
                        placeholder="auto"
                        title="Sale price after discount (auto-calculated from Sale %)"
                        onChange={(e) => onProductFieldChange(
                          p._id,
                          'discountPrice',
                          e.target.value === '' ? null : Number(e.target.value)
                        )}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-44 rounded border px-2 py-1"
                        type="datetime-local"
                        value={toDateTimeLocal(p.saleStartAt)}
                        onChange={(e) => onProductFieldChange(p._id, 'saleStartAt', e.target.value || null)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-44 rounded border px-2 py-1"
                        type="datetime-local"
                        value={toDateTimeLocal(p.saleEndAt)}
                        onChange={(e) => onProductFieldChange(p._id, 'saleEndAt', e.target.value || null)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={Boolean(p.isApproved)}
                        onChange={(e) => onProductFieldChange(p._id, 'isApproved', e.target.checked)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={Boolean(p.isActive)}
                        onChange={(e) => onProductFieldChange(p._id, 'isActive', e.target.checked)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-black px-3 py-1 text-white"
                          onClick={() => updateProduct(p._id, {
                            price: Number(p.price) || 0,
                            saleType: p.saleType,
                            salePercent: Number(p.salePercent) || 0,
                            discountPrice: p.discountPrice !== null && p.discountPrice !== undefined ? Number(p.discountPrice) : null,
                            saleStartAt: p.saleStartAt || null,
                            saleEndAt: p.saleEndAt || null,
                            isApproved: p.isApproved,
                            isActive: p.isActive
                          })}
                        >
                          Save
                        </button>
                        <button
                          className="rounded bg-red-600 px-3 py-1 text-white"
                          onClick={() => deleteProduct(p._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ─── Orders Management ─── */}
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Order Management ({orders.length})</h2>
            {!orders.length ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {orders.map((order) => (
                  <AdminOrderRow
                    key={order._id}
                    order={order}
                    token={token}
                    apiBase={API_BASE}
                    onUpdate={(updated) =>
                      setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)))
                    }
                    onMsg={setMessage}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Verified Badge Subscription Fee</h2>
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="w-48 rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                value={verificationFee}
                onChange={(e) => setVerificationFee(e.target.value)}
              />
              <button className="rounded bg-black px-4 py-2 text-sm text-white" onClick={updateVerificationFee}>
                Update Fee
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            <h2 className="text-lg font-semibold">Coupon Manager</h2>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="Code (e.g. EID150)"
                value={couponForm.code}
                onChange={(e) => onCouponFormChange('code', e.target.value.toUpperCase())}
              />
              <select
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                value={couponForm.type}
                onChange={(e) => onCouponFormChange('type', e.target.value)}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="Value"
                value={couponForm.value}
                onChange={(e) => onCouponFormChange('value', e.target.value)}
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="Min order amount"
                value={couponForm.minOrderAmount}
                onChange={(e) => onCouponFormChange('minOrderAmount', e.target.value)}
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="Max discount (optional)"
                value={couponForm.maxDiscount}
                onChange={(e) => onCouponFormChange('maxDiscount', e.target.value)}
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="1"
                placeholder="Total usage limit — all users (optional)"
                value={couponForm.usageLimit}
                onChange={(e) => onCouponFormChange('usageLimit', e.target.value)}
                title="Max total times this coupon can be redeemed across all users."
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                placeholder="Min items in cart (e.g. 4 = needs ≥4 items)"
                value={couponForm.minItemCount}
                onChange={(e) => onCouponFormChange('minItemCount', e.target.value)}
                title="Coupon only applies when cart has AT LEAST this many items. 0 = no restriction."
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="1"
                placeholder="Max uses per user (optional)"
                value={couponForm.perUserLimit}
                onChange={(e) => onCouponFormChange('perUserLimit', e.target.value)}
                title="Max number of times a single user can redeem this coupon."
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="1"
                placeholder="Max distinct users (optional)"
                value={couponForm.maxUsers}
                onChange={(e) => onCouponFormChange('maxUsers', e.target.value)}
                title="Max number of distinct users who can ever use this coupon."
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="datetime-local"
                value={couponForm.startsAt}
                onChange={(e) => onCouponFormChange('startsAt', e.target.value)}
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                type="datetime-local"
                value={couponForm.expiresAt}
                onChange={(e) => onCouponFormChange('expiresAt', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(couponForm.isActive)}
                  onChange={(e) => onCouponFormChange('isActive', e.target.checked)}
                />
                Active
              </label>
              <button className="rounded bg-black px-4 py-2 text-sm text-white" onClick={submitCoupon}>
                {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
              </button>
              {editingCouponId && (
                <button className="rounded border px-4 py-2 text-sm" onClick={resetCouponForm}>
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2 pr-3">Min Order</th>
                    <th className="py-2 pr-3">Used</th>
                    <th className="py-2 pr-3">Start</th>
                    <th className="py-2 pr-3">Expires</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="border-b">
                      <td className="py-2 pr-3 font-semibold">{coupon.code}</td>
                      <td className="py-2 pr-3 capitalize">{coupon.type}</td>
                      <td className="py-2 pr-3">{coupon.type === 'percentage' ? `${coupon.value}%` : `৳${Number(coupon.value || 0).toFixed(2)}`}</td>
                      <td className="py-2 pr-3">৳{Number(coupon.minOrderAmount || 0).toFixed(2)}</td>
                      <td className="py-2 pr-3">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</td>
                      <td className="py-2 pr-3">{coupon.startsAt ? new Date(coupon.startsAt).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-3">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-3">{coupon.isActive ? 'Active' : 'Inactive'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-2">
                          <button className="rounded border px-2 py-1 text-xs" onClick={() => startEditCoupon(coupon)}>Edit</button>
                          <button className="rounded border px-2 py-1 text-xs" onClick={() => toggleCouponStatus(coupon._id, !coupon.isActive)}>
                            {coupon.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="rounded border border-red-300 px-2 py-1 text-xs text-red-600" onClick={() => deleteCoupon(coupon._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!coupons.length && (
                    <tr>
                      <td className="py-3 text-slate-500" colSpan={9}>No coupons created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Flash Sale Manager</h2>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs uppercase text-orange-600">Live status</p>
                <p className="mt-1 font-semibold">{flashSale?.status === 'active' ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="rounded border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs uppercase text-orange-600">Active sale products</p>
                <p className="mt-1 font-semibold">{flashSale?.count || 0}</p>
              </div>
              <div className="rounded border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs uppercase text-orange-600">Next sale ends</p>
                <p className="mt-1 font-semibold">{flashSale?.nextEndsAt ? new Date(flashSale.nextEndsAt).toLocaleString() : 'No active sale'}</p>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-semibold">Override Global Flash Sale Countdown</p>
                <p className="text-xs text-slate-500">Leave empty to auto-calculate from product end times.</p>
              </div>
              <input
                className="rounded border border-slate-300 px-3 py-2 text-sm"
                type="datetime-local"
                value={flashSaleTimer}
                onChange={(e) => setFlashSaleTimer(e.target.value)}
              />
              <button
                className="rounded bg-black px-4 py-2 text-sm text-white"
                onClick={updateGlobalFlashSaleTimer}
              >
                Set Global Timer
              </button>
            </div>
            
            <p className="mt-3 text-sm text-slate-600">
              Use the product table above to turn products into flash-sale items, set discount prices, and choose the sale window.
            </p>
          </section>

          {/* ─── Flash Sale Applications from Sellers ─── */}
          <section className="rounded-lg border border-orange-200 bg-white p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">⚡ Flash Sale Applications</h2>
                <p className="text-xs text-slate-500">Review seller requests to put their products on flash sale.</p>
              </div>
              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((f) => (
                  <button key={f} onClick={() => setFlashAppFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      flashAppFilter === f ? 'bg-orange-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const filtered = flashSaleApps.filter(a => flashAppFilter === 'all' || a.status === flashAppFilter);
              if (!filtered.length) return <p className="text-sm text-slate-400">No applications found.</p>;
              return (
                <div className="space-y-3">
                  {filtered.map((app) => {
                    const statusColors = {
                      pending: 'bg-yellow-50 border-yellow-200',
                      approved: 'bg-green-50 border-green-200',
                      rejected: 'bg-red-50 border-red-200'
                    }[app.status] || 'bg-slate-50 border-slate-200';
                    return (
                      <div key={app._id} className={`rounded-xl border p-4 ${statusColors}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{app.product?.name || 'Unknown Product'}</p>
                            <p className="text-xs text-slate-500">
                              Seller: <strong>{app.seller?.name}</strong> · {app.seller?.email}
                            </p>
                            <p className="text-xs text-slate-500">{app.product?.category}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                            app.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                            app.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>{app.status}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
                          <span><strong>Discount:</strong> {app.requestedDiscount}%</span>
                          <span><strong>Flash Price:</strong> ৳{Number(app.requestedPrice).toFixed(0)}</span>
                          <span><strong>Start:</strong> {new Date(app.proposedStartAt).toLocaleString()}</span>
                          <span><strong>End:</strong> {new Date(app.proposedEndAt).toLocaleString()}</span>
                        </div>
                        {app.sellerNote && <p className="mt-2 text-xs text-slate-600"><strong>Seller note:</strong> {app.sellerNote}</p>}
                        {app.adminNote && <p className="mt-1 text-xs text-slate-600"><strong>Admin note:</strong> {app.adminNote}</p>}
                        {app.status === 'pending' && (
                          <AdminFlashReview appId={app._id} onReview={adminReviewFlashApp} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Seller Onboarding Applications</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Identity</th>
                  <th className="py-2 pr-3">Bank Details</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerApplications.map((u) => (
                  <tr key={u._id} className="border-b align-top">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1 font-medium">
                        {u.sellerApplication?.realName || u.name}
                        {u.isSellerVerifiedBadge && <VerifiedBadge className="h-4 w-4" />}
                      </div>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <p className="capitalize">{String(u.sellerApplication?.idType || '').replace('-', ' ')}</p>
                      <p className="text-xs text-slate-500">{u.sellerApplication?.idNumber || '-'}</p>
                    </td>
                    <td className="py-2 pr-3 max-w-[240px] whitespace-pre-wrap">{u.sellerApplication?.bankDetails || '-'}</td>
                    <td className="py-2 pr-3">{u.sellerApplication?.phoneNumber || '-'}</td>
                    <td className="py-2 pr-3 capitalize">{u.sellerApplication?.status || 'none'}</td>
                    <td className="py-2 pr-3">
                      <div className="mb-2 flex flex-wrap gap-2 text-xs">
                        {u.sellerApplication?.idDocumentUrl && (
                          <a className="underline" href={resolveImageSrc(u.sellerApplication.idDocumentUrl)} target="_blank" rel="noreferrer">ID Doc</a>
                        )}
                        {u.sellerApplication?.photoUrl && (
                          <a className="underline" href={resolveImageSrc(u.sellerApplication.photoUrl)} target="_blank" rel="noreferrer">Photo</a>
                        )}
                        {u.sellerApplication?.faceVerificationUrl && (
                          <a className="underline" href={resolveImageSrc(u.sellerApplication.faceVerificationUrl)} target="_blank" rel="noreferrer">Face Verify</a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded border px-2 py-1 text-xs" onClick={() => reviewSellerApplication(u._id, 'approved')}>Approve Seller</button>
                        <button className="rounded border px-2 py-1 text-xs" onClick={() => reviewSellerApplication(u._id, 'rejected')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Verified Badge Requests</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Seller</th>
                  <th className="py-2 pr-3">Tip Paid</th>
                  <th className="py-2 pr-3">Required Fee</th>
                  <th className="py-2 pr-3">Payment</th>
                  <th className="py-2 pr-3">Badge Status</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {badgeRequests.map((u) => (
                  <tr key={u._id} className="border-b align-top">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1 font-medium">
                        {u.name}
                        {u.isSellerVerifiedBadge && <VerifiedBadge className="h-4 w-4" />}
                      </div>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-2 pr-3">৳{Number(u.sellerVerification?.tipPaidAmount || 0).toFixed(2)}</td>
                    <td className="py-2 pr-3">৳{Number(u.sellerVerification?.subscriptionFeeAmount || 0).toFixed(2)}</td>
                    <td className="py-2 pr-3 capitalize">{u.sellerVerification?.paymentStatus || 'unpaid'}</td>
                    <td className="py-2 pr-3 capitalize">{u.sellerVerification?.badgeStatus || 'unverified'}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded border px-2 py-1 text-xs" onClick={() => reviewVerifiedBadge(u._id, 'verify', false)}>Verify (Paid)</button>
                        <button className="rounded border px-2 py-1 text-xs" onClick={() => reviewVerifiedBadge(u._id, 'verify', true)}>Verify (Waive Fee)</button>
                        <button className="rounded border px-2 py-1 text-xs" onClick={() => reviewVerifiedBadge(u._id, 'reject', false)}>Reject</button>
                        <button className="rounded border px-2 py-1 text-xs" onClick={() => reviewVerifiedBadge(u._id, 'clear', false)}>Clear</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Manage Orders</h2>
            <input
              className="mb-3 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="Optional status note (e.g., handed to courier)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-b">
                    <td className="py-2 pr-3">#{o._id.slice(-6).toUpperCase()}</td>
                    <td className="py-2 pr-3">{o.user?.name || 'N/A'}</td>
                    <td className="py-2 pr-3">৳{Number(o.total || 0).toFixed(2)}</td>
                    <td className="py-2 pr-3">{o.status}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                          <button key={status} className="rounded border px-2 py-1 text-xs" onClick={() => updateOrderStatus(o._id, status)}>
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Manage Users</h2>
            <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 lg:grid-cols-4">
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="Admin Name"
                value={adminForm.name}
                onChange={(e) => onAdminFormChange('name', e.target.value)}
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="Admin Email"
                type="email"
                value={adminForm.email}
                onChange={(e) => onAdminFormChange('email', e.target.value)}
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="Admin Phone"
                value={adminForm.phone}
                onChange={(e) => onAdminFormChange('phone', e.target.value)}
              />
              <input
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="Password (min 6 chars)"
                type="password"
                value={adminForm.password}
                onChange={(e) => onAdminFormChange('password', e.target.value)}
              />
              <div className="md:col-span-2 lg:col-span-4">
                <button
                  className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-70"
                  onClick={createAdmin}
                  disabled={creatingAdmin}
                >
                  {creatingAdmin ? 'Creating Admin...' : 'Create New Admin'}
                </button>
              </div>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b">
                    <td className="py-2 pr-3">{u.name}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3 capitalize">{u.role}</td>
                    <td className="py-2 pr-3">{u.isBlocked ? 'Blocked' : 'Active'}</td>
                    <td className="py-2 pr-3">
                      <button className="rounded bg-black px-3 py-1 text-white" onClick={() => toggleBlockUser(u._id, !u.isBlocked)}>
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
      </main>
    </MarketplaceLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-bold">{value ?? 0}</p>
    </div>
  );
}

const ALL_STATUSES = ['pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700', paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700', processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

function AdminOrderRow({ order: o, token, apiBase, onUpdate, onMsg }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(o.status || 'pending');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState({ courierService: o.tracking?.courierService || '', trackingId: o.tracking?.trackingId || '', trackingUrl: o.tracking?.trackingUrl || '' });
  const [savingTracking, setSavingTracking] = useState(false);

  const updateStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/orders/admin/${o._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      onUpdate(data.order || { ...o, status });
      onMsg(`✅ Order ${String(o._id).slice(-6).toUpperCase()} → ${status}`);
      setNote('');
    } catch (err) { onMsg(err.message); }
    finally { setSaving(false); }
  };

  const saveTracking = async () => {
    setSavingTracking(true);
    try {
      const res = await fetch(`${apiBase}/orders/admin/${o._id}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(tracking)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      onMsg('✅ Tracking info saved');
    } catch (err) { onMsg(err.message); }
    finally { setSavingTracking(false); }
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50">
        <div>
          <span className="font-mono text-xs text-gray-400">#{String(o._id).slice(-8).toUpperCase()}</span>
          <span className="ml-2 font-semibold">{o.guestCustomer?.name || 'User'}</span>
          <span className="ml-2 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-orange-600">৳{Number(o.total || 0).toFixed(0)}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>{o.status}</span>
          <span className="text-gray-400">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
          {/* Items */}
          <ul className="space-y-1 text-xs bg-gray-50 rounded-lg p-3">
            {(o.products || []).map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.name || `Product #${i + 1}`} × {item.quantity || 1}</span>
                <span>৳{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(0)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500">📍 {o.shippingAddress?.fullAddress || 'No address'} · 💳 {o.paymentMethod}</p>

          {/* Status update */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="mb-2 text-xs font-bold text-indigo-700">Update Status</p>
            <div className="flex flex-wrap gap-2">
              <select className="rounded border border-indigo-200 bg-white px-2 py-1.5 text-sm"
                value={status} onChange={(e) => setStatus(e.target.value)}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="flex-1 rounded border border-indigo-200 bg-white px-2 py-1.5 text-sm"
                placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button onClick={updateStatus} disabled={saving || status === o.status}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? '...' : 'Update'}
              </button>
            </div>
          </div>

          {/* Tracking */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
            <p className="mb-2 text-xs font-bold text-orange-700">Courier Tracking</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <input className="rounded border bg-white px-2 py-1.5 text-xs" placeholder="Service (e.g. Pathao)"
                value={tracking.courierService} onChange={(e) => setTracking((t) => ({ ...t, courierService: e.target.value }))} />
              <input className="rounded border bg-white px-2 py-1.5 text-xs font-mono" placeholder="Parcel ID"
                value={tracking.trackingId} onChange={(e) => setTracking((t) => ({ ...t, trackingId: e.target.value }))} />
              <input className="rounded border bg-white px-2 py-1.5 text-xs" placeholder="Tracking URL"
                value={tracking.trackingUrl} onChange={(e) => setTracking((t) => ({ ...t, trackingUrl: e.target.value }))} />
            </div>
            <button onClick={saveTracking} disabled={savingTracking}
              className="mt-2 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50">
              {savingTracking ? '...' : 'Save Tracking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminFlashReview({ appId, onReview }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async (action) => {
    setSaving(true);
    await onReview(appId, action, note);
    setSaving(false);
  };

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <textarea
        className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-xs"
        rows={2}
        placeholder="Optional note to seller..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={() => handle('approve')}
          disabled={saving}
          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
        >
          ✅ Approve
        </button>
        <button
          onClick={() => handle('reject')}
          disabled={saving}
          className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60"
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
}
