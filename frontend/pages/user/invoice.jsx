import Link from 'next/link';
import MarketplaceLayout from '../../components/MarketplaceLayout';

export default function Invoice() {
  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-black">Invoice Center</h1>
        <p className="mt-2 text-sm text-slate-600">Invoices are generated per order. Visit your orders to download them.</p>
        <Link href="/user/orders" className="mt-4 inline-block rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Go to Orders</Link>
      </main>
    </MarketplaceLayout>
  );
}
