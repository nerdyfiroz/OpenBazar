import Link from 'next/link';
import MarketplaceLayout from '../components/MarketplaceLayout';

export default function PrivacyPolicy() {
  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

        <div className="prose prose-slate mt-8 max-w-none text-sm leading-relaxed">
          <p>OpenBazar (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our marketplace platform.</p>

          <h2 className="mt-6 text-lg font-bold">1. Information We Collect</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Account information:</strong> Name, email address, phone number, and password when you register.</li>
            <li><strong>Order information:</strong> Shipping address, payment method, transaction IDs, and order history.</li>
            <li><strong>Usage data:</strong> Pages visited, products viewed, search queries, and time spent on the platform.</li>
            <li><strong>Device information:</strong> IP address, browser type, and operating system.</li>
          </ul>

          <h2 className="mt-6 text-lg font-bold">2. How We Use Your Information</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
            <li>To process and fulfill your orders.</li>
            <li>To communicate with you about orders, promotions, and updates.</li>
            <li>To improve our platform and personalize your experience.</li>
            <li>To prevent fraud and ensure platform security.</li>
            <li>To comply with legal obligations.</li>
          </ul>

          <h2 className="mt-6 text-lg font-bold">3. Sharing Your Information</h2>
          <p className="mt-2 text-slate-600">We do not sell your personal information. We may share your information with:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Sellers:</strong> Your shipping address and name are shared with the seller to fulfill your order.</li>
            <li><strong>Courier services:</strong> Order details are shared with delivery partners.</li>
            <li><strong>Payment providers:</strong> Transaction data is processed by our payment partners.</li>
            <li><strong>Legal authorities:</strong> When required by law.</li>
          </ul>

          <h2 className="mt-6 text-lg font-bold">4. Data Security</h2>
          <p className="mt-2 text-slate-600">We use industry-standard encryption (HTTPS, bcrypt for passwords) to protect your data. However, no method of transmission over the internet is 100% secure.</p>

          <h2 className="mt-6 text-lg font-bold">5. Cookies</h2>
          <p className="mt-2 text-slate-600">We use localStorage to store your cart, wishlist, and session token. We may use cookies for analytics and performance monitoring.</p>

          <h2 className="mt-6 text-lg font-bold">6. Your Rights</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
            <li>Access and update your personal information from your account dashboard.</li>
            <li>Request deletion of your account by contacting us.</li>
            <li>Opt out of promotional emails at any time.</li>
          </ul>

          <h2 className="mt-6 text-lg font-bold">7. Children's Privacy</h2>
          <p className="mt-2 text-slate-600">OpenBazar is not intended for users under the age of 13. We do not knowingly collect personal information from children.</p>

          <h2 className="mt-6 text-lg font-bold">8. Changes to This Policy</h2>
          <p className="mt-2 text-slate-600">We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.</p>

          <h2 className="mt-6 text-lg font-bold">9. Contact Us</h2>
          <p className="mt-2 text-slate-600">If you have any questions about this Privacy Policy, please contact us at <Link href="mailto:support@openbazar.com.bd" className="text-orange-500 hover:underline">support@openbazar.com.bd</Link>.</p>
        </div>
      </main>
    </MarketplaceLayout>
  );
}
