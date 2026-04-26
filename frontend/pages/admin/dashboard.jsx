import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';

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
  const [coupons, setCoupons] = useState([]);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrderAmount: 0,
    maxDiscount: '',
    usageLimit: '',
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
      const [dashRes, productRes, orderRes, userRes, sellerAppRes, badgeReqRes, feeRes, flashSaleRes, couponRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/products/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/orders/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/auth/admin/seller-applications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/auth/admin/seller-verification-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/auth/admin/seller-verification-fee`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/dashboard/flash-sale`),
        fetch(`${API_BASE}/coupons/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!dashRes.ok || !productRes.ok || !orderRes.ok || !userRes.ok || !sellerAppRes.ok || !badgeReqRes.ok || !feeRes.ok || !flashSaleRes.ok || !couponRes.ok) {
        throw new Error('Failed to load admin data. Ensure you are logged in as admin.');
      }

      const dashData = await dashRes.json();
      const productData = await productRes.json();
      const orderData = await orderRes.json();
      const userData = await userRes.json();
      const sellerAppData = await sellerAppRes.json();
      const badgeReqData = await badgeReqRes.json();
      const feeData = await feeRes.json();
      const flashSaleData = await flashSaleRes.json();
      const couponData = await couponRes.json();
      setDashboard(dashData);
      setProducts(normalizeList(productData, 'products'));
      setOrders(normalizeList(orderData, 'orders'));
      setUsers(normalizeList(userData, 'users'));
      setSellerApplications(normalizeList(sellerAppData, 'users'));
      setBadgeRequests(normalizeList(badgeReqData, 'users'));
      setVerificationFee(Number(feeData.fee || 0));
      setFlashSale(flashSaleData);
      setCoupons(Array.isArray(couponData) ? couponData : []);
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

  const submitCoupon = async () => {
    if (!token) return;

    const payload = {
      code: couponForm.code,
      type: couponForm.type,
      value: Number(couponForm.value || 0),
      minOrderAmount: Number(couponForm.minOrderAmount || 0),
      maxDiscount: couponForm.maxDiscount === '' ? null : Number(couponForm.maxDiscount),
      usageLimit: couponForm.usageLimit === '' ? null : Number(couponForm.usageLimit),
      startsAt: couponForm.startsAt,
      expiresAt: couponForm.expiresAt,
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
                  <th className="py-2 pr-3">Discount Price</th>
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
                        value={p.discountPrice ?? ''}
                        placeholder="none"
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
                            price: p.price,
                            saleType: p.saleType,
                            salePercent: p.salePercent,
                            discountPrice: p.discountPrice,
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
                placeholder="Usage limit (optional)"
                value={couponForm.usageLimit}
                onChange={(e) => onCouponFormChange('usageLimit', e.target.value)}
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
            <p className="mt-3 text-sm text-slate-600">
              Use the product table above to turn products into flash-sale items, set discount prices, and choose the sale window.
            </p>
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
                      <p className="font-medium">{u.sellerApplication?.realName || u.name}</p>
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
                          <a className="underline" href={`${API_ORIGIN}${u.sellerApplication.idDocumentUrl}`} target="_blank" rel="noreferrer">ID Doc</a>
                        )}
                        {u.sellerApplication?.photoUrl && (
                          <a className="underline" href={`${API_ORIGIN}${u.sellerApplication.photoUrl}`} target="_blank" rel="noreferrer">Photo</a>
                        )}
                        {u.sellerApplication?.faceVerificationUrl && (
                          <a className="underline" href={`${API_ORIGIN}${u.sellerApplication.faceVerificationUrl}`} target="_blank" rel="noreferrer">Face Verify</a>
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
                      <p className="font-medium">{u.name}</p>
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
