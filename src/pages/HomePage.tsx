import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { getProducts } from '@/services/productService';
import { Product, CATEGORIES, NEIGHBORHOODS } from '@/types';

interface HomePageProps {
  onProductClick: (product: Product) => void;
  onProfileClick: () => void;
}

const ALL_CATEGORIES = [
  { id: 'all', name: 'Tout', icon: null },
  ...CATEGORIES,
];

const TrustBadges = () => (
  <div className="flex gap-2 mt-5 flex-wrap">
    <div className="trust-badge">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>
      </svg>
      Profils vérifiés
    </div>
    <div className="trust-badge">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
        <path d="M11.99 2C6.465 2 2.011 6.46 2.011 11.985a9.916 9.916 0 001.337 5.003L2 22l5.16-1.321a9.955 9.955 0 004.83 1.24c5.524 0 9.979-4.452 9.979-9.977A9.97 9.97 0 0011.99 2z"/>
      </svg>
      WhatsApp Direct
    </div>
    <div className="trust-badge">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
      Mobile Money
    </div>
  </div>
);

export function HomePage({ onProductClick, onProfileClick }: HomePageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('brumerie_bookmarks'); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        neighborhood: selectedNeighborhood !== 'all' ? selectedNeighborhood : undefined,
        searchTerm: searchTerm || undefined,
      });
      setProducts(data);
    } catch { } finally { setLoading(false); }
  }, [selectedCategory, selectedNeighborhood, searchTerm]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 300);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const handleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('brumerie_bookmarks', JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      <Header onProfileClick={onProfileClick} onSearchChange={setSearchTerm} searchTerm={searchTerm} />

      {/* Hero */}
      {!searchTerm && (
        <div className="px-5 pt-6 animate-fade-in">
          <div
            className="rounded-[3rem] p-10 overflow-hidden relative shadow-2xl shadow-green-100"
            style={{ background: 'linear-gradient(135deg, #16A34A 0%, #115E2E 100%)' }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-bold text-white uppercase tracking-[0.2em]">
                  Abidjan • En direct
                </span>
              </div>
              <h2 className="text-white text-4xl font-black leading-[0.9] tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>
                TROUVE<br />TON BONHEUR.
              </h2>
              <p className="text-green-50 text-[11px] font-bold mt-6 uppercase tracking-[0.1em] opacity-80">
                {products.length} pépites dénichées
              </p>
              <TrustBadges />
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute right-8 top-8 opacity-10 select-none pointer-events-none">
              <img src="/favicon.png" alt="" className="w-16 h-16 object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Catégories */}
      <div className="mt-10">
        <div className="px-6 mb-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Rayons</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto px-5 pb-6 scrollbar-hide">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-[11px] font-bold transition-all ${isActive ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300 -translate-y-1' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                {cat.icon && <span className={isActive ? 'opacity-100' : 'grayscale opacity-70'}>{cat.icon}</span>}
                <span className="uppercase tracking-widest">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quartiers */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-6 mb-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">À proximité</h3>
          {selectedNeighborhood !== 'all' && (
            <button onClick={() => setSelectedNeighborhood('all')} className="text-[9px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
              Effacer
            </button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-4 scrollbar-hide">
          <button onClick={() => setSelectedNeighborhood('all')}
            className={`flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${selectedNeighborhood === 'all' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8z"/>
            </svg>
            Tout Abidjan
          </button>
          {NEIGHBORHOODS.map((n) => (
            <button key={n} onClick={() => setSelectedNeighborhood(n)}
              className={`flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${selectedNeighborhood === n ? 'border-green-600 bg-green-50 text-green-700 shadow-lg shadow-green-100' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Grille produits */}
      <div className="px-5 mt-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Derniers arrivages</h3>
          <div className="h-[3px] flex-1 mx-6 bg-slate-50 rounded-full" />
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-5">{[1,2,3,4,5,6].map(i => <ProductSkeleton key={i} />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 px-10 bg-slate-50 rounded-[3rem] border-4 border-dashed border-white">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">C'est le désert ici</h3>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide">Aucun article trouvé.<br />Sois le premier à publier !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 animate-fade-up">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
                onBookmark={handleBookmark}
                isBookmarked={bookmarks.has(product.id)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="h-16" />
    </div>
  );
}
