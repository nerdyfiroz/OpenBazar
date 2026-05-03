import MarketplaceLayout from '../components/MarketplaceLayout';

export default function About() {
  return (
    <MarketplaceLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-800">About OpenBazar</h1>
          <p className="mt-4 text-lg text-slate-600">
            Bangladesh's most trusted online marketplace for fresh food, electronics, fashion, and daily essentials.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-orange-500">Our Mission</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              At OpenBazar, our mission is to empower local businesses and provide consumers with seamless access to high-quality products. We bridge the gap between verified sellers and smart shoppers, ensuring authenticity, speed, and trust in every transaction.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-indigo-500">Our Vision</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              We envision a digitally connected Bangladesh where anyone, anywhere can order fresh mangoes from Rajshahi or the latest gadgets from Dhaka with complete peace of mind. We are building the infrastructure for the next generation of e-commerce.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-white text-center shadow-lg">
          <h2 className="text-2xl font-bold">Why Choose Us?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-4xl">💯</p>
              <p className="mt-2 font-semibold">Verified Sellers</p>
            </div>
            <div>
              <p className="text-4xl">⚡</p>
              <p className="mt-2 font-semibold">Fast Delivery</p>
            </div>
            <div>
              <p className="text-4xl">🔒</p>
              <p className="mt-2 font-semibold">Secure Payments</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl font-bold text-slate-800">Need to get in touch?</h2>
          <p className="mt-2 text-slate-600">We're here to help you 24/7.</p>
          <a href="/contact" className="mt-4 inline-block rounded-full bg-slate-800 px-6 py-2.5 font-bold text-white transition hover:bg-slate-700">
            Contact Us
          </a>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
