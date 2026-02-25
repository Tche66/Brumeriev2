import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { getProducts } from '@/services/productService';
import { getBookmarks, addBookmark, removeBookmark } from '@/services/bookmarkService';
import { useAuth } from '@/contexts/AuthContext';
import { Product, CATEGORIES, NEIGHBORHOODS } from '@/types';

interface HomePageProps {
  onProductClick: (product: Product) => void;
  onProfileClick: () => void;
}

const ALL_CATEGORIES = [{ id: 'all', name: 'Tout', icon: null }, ...CATEGORIES];

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
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.956 9.956 0 01-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
        <path d="M11.99 2C6.465 2 2.011 6.46 2.011 11.985a9.916 9.916 0 001.337 5.003L2 22l5.16-1.321a9.955 9.955 0 004.83 1.24c5.524 0 9.979-4.452 9.979-9.977A9.97 9.97 0 0011.99 2z"/>
      </svg>
      WhatsApp Direct
    </div>
    <div className="trust-badge">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
      Mobile Money très bientôt
    </div>
  </div>
);

export function HomePage({ onProductClick, onProfileClick }: HomePageProps) {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Charger favoris Firebase (par utilisateur)
  useEffect(() => {
    if (!currentUser) return;
    getBookmarks(currentUser.uid).then(ids => setBookmarks(new Set(ids)));
  }, [currentUser]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        neighborhood: selectedNeighborhood !== 'all' ? selectedNeighborhood : undefined,
        searchTerm: searchTerm || undefined,
      });
      setProducts(data);
    } catch { }
    finally { setLoading(false); }
  }, [selectedCategory, selectedNeighborhood, searchTerm]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 300);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const handleBookmark = async (id: string) => {
    if (!currentUser) return;
    const next = new Set(bookmarks);
    if (next.has(id)) {
      next.delete(id);
      await removeBookmark(currentUser.uid, id);
    } else {
      next.add(id);
      await addBookmark(currentUser.uid, id);
    }
    setBookmarks(next);
  };

  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      <Header onProfileClick={onProfileClick} onSearchChange={setSearchTerm} searchTerm={searchTerm} />

      {/* Hero */}
      {!searchTerm && (
        <div className="px-5 pt-6 animate-fade-in">
          <div className="rounded-[3rem] p-8 overflow-hidden relative shadow-2xl shadow-green-100"
            style={{ background: 'linear-gradient(135deg, #16A34A 0%, #115E2E 100%)' }}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-bold text-white uppercase tracking-[0.2em]">
                  🇨🇮 Abidjan • En direct
                </span>
              </div>
              <h2 className="text-white font-black leading-tight tracking-tight" style={{ fontSize: '2rem' }}>
                Trouve ton bonheur.
              </h2>
              <p className="text-green-50 text-[11px] font-bold mt-3 uppercase tracking-[0.1em] opacity-80">
                {products.length} pépites dénichées
              </p>
              <TrustBadges />
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute right-6 top-6 opacity-40 select-none pointer-events-none">
              <span style={{ fontSize: '52px', lineHeight: 1 }}>🇨🇮</span>
            </div>
          </div>
        </div>
      )}

      {/* Catégories */}
      <div className="mt-8">
        <div className="px-6 mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Rayons</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-4 scrollbar-hide">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-bold transition-all ${isActive ? 'bg-slate-900 text-white shadow-lg -translate-y-0.5' : 'bg-slate-50 text-slate-500'}`}
              >
                {cat.icon && <span>{cat.icon}</span>}
                <span className="uppercase tracking-wider">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quartiers */}
      <div className="mt-2">
        <div className="flex items-center justify-between px-6 mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">À proximité</h3>
          {selectedNeighborhood !== 'all' && (
            <button onClick={() => setSelectedNeighborhood('all')} className="text-[9px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
              Effacer
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-hide">
          <button onClick={() => setSelectedNeighborhood('all')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border-2 transition-all ${selectedNeighborhood === 'all' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
            Tout Abidjan
          </button>
          {NEIGHBORHOODS.map((n) => (
            <button key={n} onClick={() => setSelectedNeighborhood(n)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border-2 transition-all ${selectedNeighborhood === n ? 'border-green-600 bg-green-50 text-green-700 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Grille produits */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Derniers arrivages</h3>
          <div className="h-[2px] flex-1 mx-4 bg-slate-50 rounded-full" />
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">{[1,2,3,4,5,6].map(i => <ProductSkeleton key={i} />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 px-10 bg-slate-50 rounded-[3rem] border-4 border-dashed border-white">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">Aucun article trouvé</p>
            <p className="text-[10px] font-bold text-slate-400">Sois le premier à publier !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 animate-fade-up">
            {products.map((product) => (
              <ProductCard key={product.id} product={product}
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
