import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { resolveImageSrc, FALLBACK_IMAGE } from '../utils/resolveImageSrc';

export default function MangoSelectionModal({ product, onClose, onAdd }) {
  const router = useRouter();
  const [selectedWeight, setSelectedWeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const weightPrices = useMemo(() => {
    const raw = Array.isArray(product?.weightPrices) ? product.weightPrices : [];
    if (raw.length) return raw;

    // Fallback for legacy mango products where weightPrices wasn't stored correctly.
    const basePerKg = Number(product?.price || 0);
    if (!Number.isFinite(basePerKg) || basePerKg <= 0) return [];
    return [5, 10, 15, 20, 30, 40].map((kg) => ({
      weight: `${kg}kg`,
      price: basePerKg * kg
    }));
  }, [product]);

  const salePercent = Number(product?.salePercent || 0);

  const selectedWeightData = useMemo(() => {
    if (!selectedWeight) return null;
    return weightPrices.find((wp) => wp.weight === selectedWeight) || null;
  }, [selectedWeight, weightPrices]);

  const unitPrice = useMemo(() => {
    const basePrice = Number(selectedWeightData?.price || 0);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;
    if (salePercent > 0) {
      return Number((basePrice * (1 - salePercent / 100)).toFixed(2));
    }
    return basePrice;
  }, [salePercent, selectedWeightData]);

  const canSubmit = Boolean(selectedWeight) && quantity >= 1 && unitPrice > 0;

  const submit = async (mode = 'cart') => {
    if (!selectedWeight) {
      setMsg('Please select a weight.');
      return;
    }
    if (!weightPrices.length) {
      setMsg('Weight options are not available for this product.');
      return;
    }

    onAdd({
      ...product,
      selectedWeight,
      unitPrice
    }, quantity);

    onClose();
    if (mode === 'checkout') {
      await router.push('/checkout');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 bg-slate-100">
          <img 
            src={resolveImageSrc(product.images?.[0] || product.photos?.[0])} 
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
          />
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 font-bold text-slate-800 shadow hover:bg-white">✕</button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Mango Options</p>
            <h2 className="text-2xl font-black text-slate-800">{product.name}</h2>
            <p className="text-sm text-slate-500">Select your preferred weight option below.</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {weightPrices.length ? weightPrices.map((wp) => {
              const originalPrice = Number(wp.price || 0);
              const discountedPrice = salePercent > 0 ? (originalPrice * (1 - salePercent / 100)) : originalPrice;
              
              return (
                <button
                  key={wp.weight}
                  type="button"
                  onClick={() => {
                    setSelectedWeight(wp.weight);
                    setMsg('');
                  }}
                  className={`relative flex flex-col items-center rounded-2xl border-2 p-3 transition ${
                    selectedWeight === wp.weight 
                      ? 'border-orange-500 bg-orange-50 shadow-md scale-105' 
                      : 'border-slate-100 bg-slate-50 hover:border-orange-200'
                  }`}
                >
                  <span className="text-sm font-bold">{wp.weight}</span>
                  <div className="mt-1">
                    <p className={`text-sm font-black ${salePercent > 0 ? 'text-orange-500' : 'text-slate-700'}`}>
                      ৳{discountedPrice.toFixed(0)}
                    </p>
                    {salePercent > 0 && (
                      <p className="text-[10px] text-slate-400 line-through">৳{originalPrice.toFixed(0)}</p>
                    )}
                  </div>
                  {selectedWeight === wp.weight && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">✓</div>
                  )}
                </button>
              );
            }) : (
              <div className="col-span-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Weight options are not available for this product yet.
              </div>
            )}
          </div>

          <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <span className="text-sm font-bold text-slate-700">Quantity</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold shadow-sm hover:bg-orange-50">−</button>
              <span className="text-lg font-black">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold shadow-sm hover:bg-orange-50">+</button>
            </div>
          </div>

          {msg && <p className="mb-4 text-center text-sm font-bold text-rose-500">{msg}</p>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => submit('cart')}
              className={`w-full rounded-2xl border py-4 text-sm font-black shadow-sm transition ${
                canSubmit
                  ? 'border-orange-200 bg-white text-orange-600 hover:bg-orange-50'
                  : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              Add to Cart
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => submit('checkout')}
              className={`w-full rounded-2xl py-4 text-sm font-black text-white shadow-lg transition ${
                canSubmit
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                  : 'cursor-not-allowed bg-slate-300'
              }`}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
