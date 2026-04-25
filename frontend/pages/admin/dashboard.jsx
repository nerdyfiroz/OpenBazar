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

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      setMessage('Admin token not found. Please login as admin.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const [dashRes, productRes, orderRes, userRes, sellerAppRes, badgeReqRes, feeRes] = await Promise.all([
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
        })
      ]);

      if (!dashRes.ok || !productRes.ok || !orderRes.ok || !userRes.ok || !sellerAppRes.ok || !badgeReqRes.ok || !feeRes.ok) {
        throw new Error('Failed to load admin data. Ensure you are logged in as admin.');
      }

      const dashData = await dashRes.json();
      const productData = await productRes.json();
      const orderData = await orderRes.json();
      const userData = await userRes.json();
      const sellerAppData = await sellerAppRes.json();
      const badgeReqData = await badgeReqRes.json();
      const feeData = await feeRes.json();
      setDashboard(dashData);
      setProducts(normalizeList(productData, 'products'));
      setOrders(normalizeList(orderData, 'orders'));
      setUsers(normalizeList(userData, 'users'));
      setSellerApplications(normalizeList(sellerAppData, 'users'));
      setBadgeRequests(normalizeList(badgeReqData, 'users'));
      setVerificationFee(Number(feeData.fee || 0));
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
                  <th className="py-2 pr-3">Base Price</th>
                  <th className="py-2 pr-3">Discount Price</th>
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
                            discountPrice: p.discountPrice,
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
