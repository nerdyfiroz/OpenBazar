import Link from 'next/link';
import MarketplaceLayout from '../components/MarketplaceLayout';

export default function Terms() {
  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="text-lg font-bold text-slate-800">1. Acceptance of Terms</h2>
            <p className="mt-2">By accessing or using OpenBazar, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">2. User Accounts</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>OpenBazar reserves the right to suspend accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">3. Sellers</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Sellers must submit a verified application and be approved by OpenBazar admin.</li>
              <li>Sellers are responsible for the accuracy of their product listings, prices, and stock.</li>
              <li>Sellers must fulfill orders in a timely manner and communicate tracking information.</li>
              <li>OpenBazar reserves the right to remove any product listing that violates our policies.</li>
              <li>Sellers may not list counterfeit, illegal, or prohibited items.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">4. Buyers</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Buyers must provide accurate shipping and payment information.</li>
              <li>For mobile banking payments (bKash, Nagad, Rocket), buyers must send the exact amount and provide a valid transaction ID.</li>
              <li>Orders with invalid transaction IDs may be cancelled.</li>
              <li>Buyers may cancel pending orders before the seller confirms shipment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">5. Payments</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>We accept Cash on Delivery (COD), bKash, Nagad, and Rocket.</li>
              <li>All prices are in Bangladeshi Taka (৳ BDT).</li>
              <li>Delivery charges are calculated based on your division and number of items.</li>
              <li>Coupons are subject to their individual terms and expiry dates.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">6. Delivery</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Delivery within Dhaka: ৳70 (Free for 4+ items)</li>
              <li>Outside Dhaka: ৳120 (70% discount for 3+ items, Free for 4+ items)</li>
              <li>Estimated delivery times are 1–3 days within Dhaka and 3–7 days for other areas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">7. Returns &amp; Refunds</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Buyers may request a return within 7 days of delivery for defective or incorrect items.</li>
              <li>Return requests must be submitted via the My Orders page.</li>
              <li>Refunds are processed within 5–7 business days after the returned item is received.</li>
              <li>Items must be unused, in original packaging with all accessories.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">8. Prohibited Activities</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Listing or purchasing illegal, counterfeit, or hazardous products.</li>
              <li>Manipulating reviews or ratings.</li>
              <li>Using the platform for fraudulent transactions.</li>
              <li>Attempting to hack, disrupt, or exploit the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">9. Limitation of Liability</h2>
            <p className="mt-2">OpenBazar acts as a marketplace platform and is not responsible for the quality, safety, or legality of products listed by sellers. We facilitate transactions but are not a party to the buyer-seller agreement.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">10. Changes to Terms</h2>
            <p className="mt-2">OpenBazar reserves the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800">11. Contact</h2>
            <p className="mt-2">For any questions regarding these Terms, contact us at <Link href="mailto:support@openbazar.com.bd" className="text-orange-500 hover:underline">support@openbazar.com.bd</Link>.</p>
          </section>
        </div>
      </main>
    </MarketplaceLayout>
  );
}
