import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { getUserById } from '@/services/userService';
import { getSellerProducts } from '@/services/productService';
import { Product, User } from '@/types';

interface SellerProfilePageProps {
  sellerId: string;
  onBack: () => void;
  onProductClick: (product: Product) => void;
}

export function SellerProfilePage({ sellerId, onBack, onProductClick }: SellerProfilePageProps) {
  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalContacts = products.reduce((acc, p) => acc + (p.whatsappClickCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Header Premium */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-5 flex items-center gap-4 border-b border-slate-100">
        <button 
          onClick={onBack} 
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 active:scale-90 transition-all"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900">Profil Vendeur</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center pt-32 gap-6 animate-pulse">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-green-600 rounded-[2rem] animate-spin" />
          <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Initialisation du profil...</p>
        </div>
      ) : seller ? (
        <div className="animate-fade-up">
          {/* Hero Seller Card */}
          <div className="bg-white px-6 pt-10 pb-8 border-b border-slate-100 shadow-sm mb-6">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="relative mb-6">
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
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-1">{seller.name}</h2>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="#94A3B8"><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>{seller.neighborhood}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span>Membre depuis {new Date(seller.createdAt).getFullYear()}</span>
              </div>
            </div>

            {/* Bento Stats XL */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-[2rem] p-5 text-center border border-slate-100">
                <p className="text-xl font-black text-slate-900 italic">{products.length}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Articles</p>
              </div>
              <div className="bg-green-50 rounded-[2rem] p-5 text-center border border-green-100/50">
                <p className="text-xl font-black text-green-700 italic">{seller.salesCount || 0}</p>
                <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mt-1">Ventes</p>
              </div>
              <div className="bg-slate-900 rounded-[2rem] p-5 text-center shadow-xl shadow-slate-200">
                <p className="text-xl font-black text-white italic">{totalContacts}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Contacts</p>
              </div>
            </div>
          </div>

          {/* Catalog Section */}
          <div className="px-6 space-y-6">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catalogue du vendeur</p>
              <span className="bg-slate-100 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full">{products.length}</span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></div>
                <p className="font-black text-slate-900 uppercase tracking-tighter italic">Boutique vide</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Reviens plus tard !</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-10">
                {products.map((product) => (
                  <div key={product.id} className="active:scale-95 transition-transform duration-300">
                    <ProductCard product={product} onClick={() => onProductClick(product)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-32 text-center px-10 animate-fade-up">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-2">Vendeur Fantôme</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase leading-relaxed tracking-widest">Ce profil n'existe pas ou a quitté l'aventure Brumerie.</p>
          <button 
            onClick={onBack} 
            className="mt-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
          >
            Retourner au quartier
          </button>
        </div>
      )}
    </div>
  );
}
