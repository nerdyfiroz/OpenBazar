import { useState } from 'react';
import { resolveImageSrc, FALLBACK_IMAGE } from '../utils/resolveImageSrc';

export default function MangoSelectionModal({ product, onClose, onAdd }) {
  const [selectedWeight, setSelectedWeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState('');

  const handleAdd = () => {
    if (!selectedWeight) return setMsg('⚠️ Please select a weight');
    
    const weightData = product.weightPrices.find(wp => wp.weight === selectedWeight);
    const basePrice = weightData?.price || 0;
    const salePercent = Number(product.salePercent || 0);
    const unitPrice = salePercent > 0 
      ? Number((basePrice * (1 - salePercent / 100)).toFixed(2))
      : basePrice;

    onAdd({
      ...product,
      selectedWeight,
      unitPrice
    }, quantity);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative h-48 bg-slate-100">
          <img 
            src={resolveImageSrc(product.images?.[0] || product.photos?.[0])} 
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
          />
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 font-bold text-slate-800 shadow hover:bg-white">✕</button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Mango Options</p>
            <h2 className="text-2xl font-black text-slate-800">{product.name}</h2>
            <p className="text-sm text-slate-500">Select your preferred weight option below.</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {product.weightPrices?.map((wp) => {
              const salePercent = Number(product.salePercent || 0);
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
            })}
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

          <button
            onClick={handleAdd}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-sm font-black text-white shadow-lg hover:from-orange-600 hover:to-amber-600"
          >
            Add to Shopping Cart
          </button>
        </div>
      </div>
    </div>
  );
}
