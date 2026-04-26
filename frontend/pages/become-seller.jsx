import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function BecomeSellerPage() {
  const [statusData, setStatusData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [submittingBadge, setSubmittingBadge] = useState(false);

  const [applicationForm, setApplicationForm] = useState({
    realName: '',
    idType: 'national-id',
    idNumber: '',
    bankDetails: '',
    phoneNumber: ''
  });
  const [applicationFiles, setApplicationFiles] = useState({
    idDocument: null,
    photo: null,
    faceVerification: null
  });

  const [badgeForm, setBadgeForm] = useState({
    tipAmount: '',
    transactionRef: '',
    note: ''
  });

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  }, []);

  const readResponse = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return res.json();
    const text = await res.text();
    return { message: text || 'Request failed' };
  };

  const loadStatus = async () => {
    if (!token) {
      setLoading(false);
      setMessage('Please login first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/auth/seller-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to load seller status');
      setStatusData(data);
      setBadgeForm((prev) => ({ ...prev, tipAmount: data.verificationFee || 0 }));
    } catch (err) {
      setMessage(err.message || 'Failed to load seller status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitSellerApplication = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!applicationFiles.idDocument || !applicationFiles.photo || !applicationFiles.faceVerification) {
      setMessage('Please upload ID document, photo, and face verification image.');
      return;
    }

    setSubmittingApplication(true);
    setMessage('');

    try {
      const formData = new FormData();
      Object.entries(applicationForm).forEach(([key, value]) => formData.append(key, value));
      formData.append('idDocument', applicationFiles.idDocument);
      formData.append('photo', applicationFiles.photo);
      formData.append('faceVerification', applicationFiles.faceVerification);

      const res = await fetch(`${API_BASE}/auth/seller/apply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to submit seller application');

      setMessage(data.message || 'Seller application submitted.');
      await loadStatus();
    } catch (err) {
      setMessage(err.message || 'Failed to submit seller application');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const submitVerifiedBadgeRequest = async (e) => {
    e.preventDefault();
    if (!token) return;

    setSubmittingBadge(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/auth/seller/verification/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tipAmount: Number(badgeForm.tipAmount || 0),
          transactionRef: badgeForm.transactionRef,
          note: badgeForm.note
        })
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to submit verified badge request');

      setMessage(data.message || 'Verified badge request submitted.');
      await loadStatus();
    } catch (err) {
      setMessage(err.message || 'Failed to submit verified badge request');
    } finally {
      setSubmittingBadge(false);
    }
  };

  const applicationStatus = statusData?.sellerApplication?.status || 'none';
  const badgeStatus = statusData?.sellerVerification?.badgeStatus || 'unverified';

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <header>
          <h1 className="text-3xl font-black">Seller Verification Center</h1>
          <p className="mt-1 text-sm text-slate-500">Apply to become a seller, then request a verified badge with subscription tip payment.</p>
        </header>

        {message && (
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">{message}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Current Status</h2>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <Badge label="Role" value={statusData?.role || 'user'} />
                <Badge label="Seller Application" value={applicationStatus} />
                <Badge label="Verified Badge" value={statusData?.isSellerVerifiedBadge ? 'verified' : badgeStatus} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Apply to Become a Seller</h2>
              <p className="mt-1 text-sm text-slate-500">Required: real name, ID, bank details, phone number, personal photo, face verification.</p>

              <form onSubmit={submitSellerApplication} className="mt-4 grid gap-3 md:grid-cols-2">
                <Input label="Real Name" value={applicationForm.realName} onChange={(value) => setApplicationForm((prev) => ({ ...prev, realName: value }))} required />

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">ID Type</span>
                  <select
                    className="input"
                    value={applicationForm.idType}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, idType: e.target.value }))}
                  >
                    <option value="national-id">National ID</option>
                    <option value="driving-license">Driving License</option>
                    <option value="passport">Passport</option>
                  </select>
                </label>

                <Input label="ID Number" value={applicationForm.idNumber} onChange={(value) => setApplicationForm((prev) => ({ ...prev, idNumber: value }))} required />
                <Input label="Phone Number" value={applicationForm.phoneNumber} onChange={(value) => setApplicationForm((prev) => ({ ...prev, phoneNumber: value }))} required />

                <TextArea
                  label="Bank Details"
                  value={applicationForm.bankDetails}
                  onChange={(value) => setApplicationForm((prev) => ({ ...prev, bankDetails: value }))}
                  className="md:col-span-2"
                  required
                />

                <FileInput label="National ID / Driving License / Passport File" onChange={(file) => setApplicationFiles((prev) => ({ ...prev, idDocument: file }))} required />
                <FileInput label="Personal Photo" onChange={(file) => setApplicationFiles((prev) => ({ ...prev, photo: file }))} required accept="image/*" />
                <FileInput label="Face Verification Photo" onChange={(file) => setApplicationFiles((prev) => ({ ...prev, faceVerification: file }))} required accept="image/*" />

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submittingApplication || applicationStatus === 'pending'}
                    className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70"
                  >
                    {submittingApplication ? 'Submitting...' : applicationStatus === 'pending' ? 'Application Pending Review' : 'Submit Seller Application'}
                  </button>
                </div>
              </form>
            </section>

            {statusData?.role === 'seller' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">Request Verified Badge</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Subscription tip required: <strong>৳{Number(statusData?.verificationFee || 0).toFixed(2)}</strong>. Admin can still grant badge without fee.
                </p>

                <form onSubmit={submitVerifiedBadgeRequest} className="mt-4 grid gap-3 md:grid-cols-2">
                  <Input
                    label="Tip Amount (৳)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={badgeForm.tipAmount}
                    onChange={(value) => setBadgeForm((prev) => ({ ...prev, tipAmount: value }))}
                    required
                  />
                  <Input
                    label="Transaction Reference"
                    value={badgeForm.transactionRef}
                    onChange={(value) => setBadgeForm((prev) => ({ ...prev, transactionRef: value }))}
                    required
                  />
                  <TextArea
                    label="Optional Note"
                    value={badgeForm.note}
                    onChange={(value) => setBadgeForm((prev) => ({ ...prev, note: value }))}
                    className="md:col-span-2"
                  />

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={submittingBadge || badgeStatus === 'pending' || statusData?.isSellerVerifiedBadge}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                    >
                      {submittingBadge ? 'Submitting...' : statusData?.isSellerVerifiedBadge ? 'Already Verified' : badgeStatus === 'pending' ? 'Badge Request Pending' : 'Submit Verified Badge Request'}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </MarketplaceLayout>
  );
}

function Badge({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{String(value || 'none').replace('-', ' ')}</p>
    </div>
  );
}

function Input({ label, className = '', onChange, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="input"
        {...props}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}

function TextArea({ label, className = '', onChange, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="input min-h-[110px]"
        {...props}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}

function FileInput({ label, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="file"
        className="input"
        onChange={(e) => onChange?.((e.target.files || [])[0] || null)}
        {...props}
      />
    </label>
  );
}
