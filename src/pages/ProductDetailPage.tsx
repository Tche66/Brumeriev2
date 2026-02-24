import React, { useState, useRef } from 'react';
import { Product } from '@/types';
import { generateWhatsAppLink, formatPrice, formatRelativeDate } from '@/utils/helpers';
import { incrementWhatsAppClick } from '@/services/productService';
import { useAuth } from '@/contexts/AuthContext';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSellerClick: (sellerId: string) => void;
}

const CATEGORIES_MAP: Record<string, string> = {
  electronics: 'Électronique',
  fashion: 'Mode',
  home: 'Maison',
  beauty: 'Beauté',
  sports: 'Sport',
  books: 'Livres',
  toys: 'Jouets',
  other: 'Autre',
};

export function ProductDetailPage({ product, onBack, onSellerClick }: ProductDetailPageProps) {
  const { userProfile } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [contacted, setContacted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // GESTIONNAIRES D'ÉVÉNEMENTS
  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollRef.current.scrollLeft / width);
      if (newIndex !== currentImageIndex) {
        setCurrentImageIndex(newIndex);
      }
    }
  };

  const scrollToImage = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: `Regarde ce que j'ai trouvé sur Brumerie : ${product.title} à ${formatPrice(product.price)} !`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) { console.log(err); }
  };

  // La fonction qui manquait et causait l'écran blanc
  const handleWhatsAppClick = () => {
    setShowWhatsAppModal(true);
  };

  const handleConfirmWhatsApp = () => {
    incrementWhatsAppClick(product.id);
    const link = generateWhatsAppLink(product.sellerPhone, product.title, product.price);
    window.open(link, '_blank');
    setShowWhatsAppModal(false);
    setContacted(true);
  };

  // Calcul sécurisé pour Firebase (Timestamp ou Date)
  const createdAtDate = product.createdAt?.toDate ? product.createdAt.toDate() : new Date(product.createdAt);
  const isNew = new Date().getTime() - createdAtDate.getTime() < 48 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-white pb-32 font-sans">
      {/* Slider Section */}
      <div className="relative bg-slate-100" style={{ aspectRatio: '1/1' }}>
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto h-full snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {product.images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 snap-center">
              <img
                src={img || 'https://via.placeholder.com/600'}
                alt={`${product.title} - ${idx}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Floating Buttons */}
        <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-10">
          <button onClick={onBack} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border border-slate-100">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#0F172A" strokeWidth="3">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button onClick={handleShare} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border border-slate-100">
            {copySuccess ? (
              <span className="text-[10px] font-black text-green-600 uppercase italic">OK</span>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0F172A" strokeWidth="2.5">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-24 right-6 flex flex-col gap-2 z-10">
          {isNew && (
            <span className="bg-green-600 text-white text-[9px] font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-widest italic">NOUVEAU</span>
          )}
          {product.status === 'sold' && (
            <span className="bg-slate-900 text-white text-[9px] font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-widest italic">VENDU</span>
          )}
        </div>

        {/* Pagination Dots */}
        {product.images.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            {product.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToImage(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? 'bg-white scale-150 w-5' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-6 left-6 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                {currentImageIndex + 1} / {product.images.length}
            </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 py-10 animate-fade-up">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <p className="price-brumerie text-[38px] text-slate-900" style={{fontFamily:"'Syne', sans-serif", fontWeight:900, letterSpacing:'-0.04em'}}>
              {product.price.toLocaleString('fr-FR')} <span className="text-[20px] text-slate-400 font-bold" style={{fontFamily:"'DM Sans', sans-serif"}}>FCFA</span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
              <span className="flex items-center gap-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="#94A3B8"><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>{product.neighborhood}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{formatRelativeDate(product.createdAt)}</span>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-900 text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">
            {CATEGORIES_MAP[product.category] || product.category}
          </span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-8 leading-tight uppercase italic">
          {product.title}
        </h1>

        <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 border border-slate-100 shadow-inner">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 italic">Description</p>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {product.description}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-[2rem] p-6 text-center border border-slate-100 shadow-xl shadow-slate-100/50">
            <p className="text-2xl font-black text-slate-900 italic">{product.whatsappClickCount || 0}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Intérêts</p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 text-center border border-slate-100 shadow-xl shadow-slate-100/50">
            <p className="text-2xl font-black text-green-600 italic">Dispo</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
          </div>
        </div>

        {/* Seller Card */}
        <button
          onClick={() => onSellerClick(product.sellerId)}
          className="w-full bg-slate-900 rounded-[2.5rem] p-6 flex items-center gap-5 active:scale-95 transition-all shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/20 shrink-0">
            {product.sellerPhoto ? (
              <img src={product.sellerPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-green-500 text-white text-2xl font-black">
                {product.sellerName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-white text-sm uppercase italic tracking-tight">{product.sellerName}</span>
              {product.sellerVerified && (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              )}
            </div>
            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Voir la boutique →</p>
          </div>
        </button>
      </div>

      {/* FIXED FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="flex justify-center pt-3 px-6">
          <button
            onClick={() => {
              const subject = encodeURIComponent('Signalement produit - Brumerie');
              const body = encodeURIComponent(`Bonjour,\n\nJe souhaite signaler :\nTitre : ${product.title}\nVendeur : ${product.sellerName}\nRaison : [Décris ici le problème]`);
              window.open(`mailto:brumerieciv.email@gmail.com?subject=${subject}&body=${body}`, '_blank');
            }}
            className="report-btn"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Signaler cette annonce
          </button>
        </div>
        <div className="p-4 pt-2">
          <button
            onClick={handleWhatsAppClick}
            disabled={product.status === 'sold'}
            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all ${
              product.status === 'sold'
                ? 'bg-slate-100 text-slate-300'
                : contacted
                ? 'bg-slate-900 text-white'
                : 'bg-green-600 text-white shadow-xl shadow-green-200 active:scale-95'
            }`}
          >
            {product.status === 'sold' ? 'VENDU' : contacted ? 'DÉJÀ CONTACTÉ' : 'CONTACTER SUR WHATSAPP'}
          </button>
        </div>
      </div>


      {/* Modal WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end justify-center p-4 animate-fade-in" onClick={() => setShowWhatsAppModal(false)}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M11.99 2C6.465 2 2.011 6.46 2.011 11.985a9.916 9.916 0 001.337 5.003L2 22l5.16-1.321a9.955 9.955 0 004.83 1.24c5.524 0 9.979-4.452 9.979-9.977A9.97 9.97 0 0011.99 2z"/></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 text-center uppercase italic tracking-tighter">On y va ?</h3>
            <p className="text-slate-400 text-[10px] mb-8 text-center font-bold uppercase tracking-widest">
              Tu vas discuter avec <span className="text-slate-900 font-black">{product.sellerName}</span> sur WhatsApp.
            </p>

            <div className="bg-amber-50 rounded-2xl p-4 mb-8 border border-amber-100 flex gap-3 items-center">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
               <p className="text-[9px] text-amber-900 font-black uppercase leading-tight">
                 Pas de transfert d'argent sans avoir vu l'article !
               </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowWhatsAppModal(false)} className="py-5 rounded-xl bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest">Retour</button>
              <button onClick={handleConfirmWhatsApp} className="py-5 rounded-xl bg-green-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-100 italic">C'est parti !</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
