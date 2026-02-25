import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { getUserById } from '@/services/userService';
import { getSellerProducts } from '@/services/productService';
import { addBookmark, removeBookmark } from '@/services/bookmarkService';
import { useAuth } from '@/contexts/AuthContext';
import { Product, User } from '@/types';

interface SellerProfilePageProps {
  sellerId: string;
  onBack: () => void;
  onProductClick: (product: Product) => void;
}

export function SellerProfilePage({ sellerId, onBack, onProductClick }: SellerProfilePageProps) {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [sellerData, sellerProducts] = await Promise.all([
        getUserById(sellerId),
        getSellerProducts(sellerId),
      ]);
      setSeller(sellerData);
      setProducts(sellerProducts);
      setLoading(false);
    })();
  }, [sellerId]);

  // ✅ Favoris depuis userProfile
  useEffect(() => {
    const ids = userProfile?.bookmarkedProductIds || [];
    setBookmarkIds(new Set(ids));
  }, [userProfile?.bookmarkedProductIds]);

  const handleBookmark = async (id: string) => {
    if (!currentUser) return;
    const isCurrently = bookmarkIds.has(id);
    if (isCurrently) { await removeBookmark(currentUser.uid, id); }
    else { await addBookmark(currentUser.uid, id); }
    await refreshUserProfile();
  };

  const totalContacts = products.reduce((acc, p) => acc + (p.whatsappClickCount || 0), 0);
  const soldCount = products.filter(p => p.status === 'sold').length;

  // Date membre lisible
  const memberSince = (() => {
    if (!seller?.createdAt) return null;
    try {
      const d = (seller.createdAt as any)?.toDate ? (seller.createdAt as any).toDate() : new Date(seller.createdAt);
      return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } catch { return null; }
  })();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-5 flex items-center gap-4 border-b border-slate-100">
        <button onClick={onBack} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 active:scale-90 transition-all">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900">Profil Vendeur</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center pt-32 gap-6 animate-pulse">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-green-600 rounded-[2rem] animate-spin" />
          <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Chargement...</p>
        </div>
      ) : seller ? (
        <div className="animate-fade-up">
          <div className="bg-white px-6 pt-10 pb-8 border-b border-slate-100 shadow-sm mb-6">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-5">
                <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden bg-slate-100 border-4 border-white shadow-2xl">
                  {seller.photoURL ? (
                    <img src={seller.photoURL} alt={seller.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-4xl font-black">
                      {seller.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                {seller.isVerified && (
                  <div className="absolute -bottom-1 -right-1 border-4 border-white rounded-full shadow-lg"
                    style={{ width: 26, height: 26, background: '#1D9BF0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{seller.name}</h2>

              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-3 flex-wrap justify-center">
                {seller.neighborhood && (
                  <span className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#94A3B8"><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
                    {seller.neighborhood}
                  </span>
                )}
                {memberSince && (
                  <>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span>Membre depuis {memberSince}</span>
                  </>
                )}
              </div>

              {/* Badges boutique/livraison visibles pour les clients */}
              <div className="flex gap-2 flex-wrap justify-center">
                {seller.hasPhysicalShop && (
                  <span className="flex items-center gap-1.5 bg-slate-900 text-white text-[9px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                    Boutique physique
                  </span>
                )}
                {seller.managesDelivery && (
                  <span className="flex items-center gap-1.5 bg-green-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M8 17.5h7M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                    Livraison disponible
                  </span>
                )}
              </div>

              {/* Stats : note + contacts */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 w-full justify-center">
                {/* Note */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span className="font-black text-slate-900 text-[14px]">
                      {seller.rating ? seller.rating.toFixed(1) : '—'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    {seller.reviewCount ? `${seller.reviewCount} avis` : 'Aucun avis'}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                {/* Contacts */}
                <div className="flex flex-col items-center">
                  <span className="font-black text-slate-900 text-[14px]">{(seller as any).contactCount || 0}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Contacts</span>
                </div>
              </div>
            </div>

            {/* Stats — avec ventes réelles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-[2rem] p-5 text-center border border-slate-100">
                <p className="price-brumerie text-xl text-slate-900">{products.filter(p => p.status !== 'sold').length}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Articles</p>
              </div>
              <div className="bg-green-50 rounded-[2rem] p-5 text-center border border-green-100/50">
                <p className="price-brumerie text-xl text-green-700">{soldCount}</p>
                <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mt-1">Ventes</p>
              </div>
              <div className="bg-slate-900 rounded-[2rem] p-5 text-center shadow-xl shadow-slate-200">
                <p className="price-brumerie text-xl text-white">{totalContacts}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Contacts</p>
              </div>
            </div>
          </div>

          {/* Catalogue */}
          <div className="px-6 space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catalogue du vendeur</p>
              <span className="bg-slate-100 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full">{products.filter(p => p.status !== 'sold').length}</span>
            </div>

            {products.filter(p => p.status !== 'sold').length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <p className="font-black text-slate-400 uppercase tracking-tighter text-sm">Boutique vide</p>
                <p className="text-slate-300 text-[10px] font-bold uppercase mt-1">Reviens plus tard !</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-10">
                {products.filter(p => p.status !== 'sold').map((product) => (
                  <div key={product.id} className="active:scale-95 transition-transform duration-300">
                    <ProductCard product={product} onClick={() => onProductClick(product)}
                      onBookmark={handleBookmark}
                      isBookmarked={bookmarkIds.has(product.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-32 text-center px-10 animate-fade-up">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Vendeur Fantôme</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase leading-relaxed tracking-widest">Ce profil n'existe pas.</p>
          <button onClick={onBack} className="mt-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
            Retourner au quartier
          </button>
        </div>
      )}
    </div>
  );
}
