import { useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'support', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Sending...');
    // Mock submission
    setTimeout(() => {
      setStatus('Message sent successfully! Our team will contact you shortly.');
      setForm({ name: '', email: '', subject: 'support', message: '' });
    }, 1000);
  };

  return (
    <MarketplaceLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-800">Contact Us</h1>
          <p className="mt-4 text-lg text-slate-600">
            Have a question or want to partner with us? We'd love to hear from you.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Contact Info */}
          <div className="flex flex-col justify-center space-y-8 rounded-3xl bg-slate-50 p-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Direct Email</h3>
              <p className="mt-2 text-xl font-bold text-orange-500">
                <a href="mailto:support@open-bazar.me">support@open-bazar.me</a>
              </p>
              <p className="mt-1 text-sm text-slate-500">Fastest response for order issues and technical support.</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Corporate Office</h3>
              <p className="mt-2 text-lg font-semibold text-slate-800">OpenBazar HQ</p>
              <p className="text-slate-600">Dhaka, Bangladesh</p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Business Hours</h3>
              <p className="mt-2 text-lg font-semibold text-slate-800">24/7 Support Available</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Send us a message</h2>
            {status && (
              <div className={`mt-4 rounded-lg p-3 text-sm font-semibold ${status.includes('success') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {status}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email Address</label>
                <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Reason for Contact</label>
                <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="support">Customer Support & Returns</option>
                  <option value="promotion">Promotion & Partnership</option>
                  <option value="seller">Seller Assistance</option>
                  <option value="other">Other Inquiries</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Message</label>
                <textarea required className="input min-h-[120px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help you?" />
              </div>

              <button type="submit" disabled={status === 'Sending...'} className="w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50">
                {status === 'Sending...' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
