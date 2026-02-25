import React, { useState, useRef, useEffect } from 'react';
import { Product } from '@/types';
import { generateWhatsAppLink, formatPrice, formatRelativeDate } from '@/utils/helpers';
import { incrementWhatsAppClick } from '@/services/productService';
import { getBookmarks, addBookmark, removeBookmark } from '@/services/bookmarkService';
import { useAuth } from '@/contexts/AuthContext';
import { ImageLightbox } from '@/components/ImageLightbox';
import { getOrCreateConversation } from '@/services/messagingService';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSellerClick: (sellerId: string) => void;
  onStartChat?: (convId: string) => void;
  onBuyClick?: (product: any) => void;
}

const CATEGORIES_MAP: Record<string, string> = {
  electronics: 'Électronique', fashion: 'Mode', home: 'Maison',
  beauty: 'Beauté', sports: 'Sport', books: 'Livres', toys: 'Jouets', other: 'Autre',
};

export function ProductDetailPage({ product, onBack, onSellerClick, onStartChat, onBuyClick }: ProductDetailPageProps) {
  const { currentUser } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [contacted, setContacted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [lastDist, setLastDist] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  // ✅ Bookmark depuis userProfile directement — toujours à jour
  const { userProfile, refreshUserProfile } = useAuth();
  useEffect(() => {
    const ids = userProfile?.bookmarkedProductIds || [];
    setIsBookmarked(ids.includes(product.id));
  }, [userProfile, product.id]);

  const handleStartChat = async () => {
    if (!currentUser || !userProfile) return;
    if (currentUser.uid === product.sellerId) return; // pas de chat avec soi-même
    setStartingChat(true);
    try {
      const convId = await getOrCreateConversation(
        currentUser.uid,
        product.sellerId,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] || '',
          neighborhood: product.neighborhood,
        },
        userProfile.name,
        product.sellerName,
        userProfile.photoURL,
        product.sellerPhoto,
      );
      onStartChat?.(convId);
    } catch (e) { console.error('[Chat] start error:', e); }
    finally { setStartingChat(false); }
  };

  const handleBookmark = async () => {
    if (!currentUser) return;
    const next = !isBookmarked;
    setIsBookmarked(next); // optimistic
    try {
      if (next) { await addBookmark(currentUser.uid, product.id); }
      else { await removeBookmark(currentUser.uid, product.id); }
      await refreshUserProfile();
    } catch { setIsBookmarked(!next); } // revert
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollRef.current.scrollLeft / width);
      if (newIndex !== currentImageIndex) setCurrentImageIndex(newIndex);
    }
  };

  const scrollToImage = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.offsetWidth * index, behavior: 'smooth' });
    }
  };

  // Pinch to zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setLastDist(Math.hypot(dx, dy));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.min(Math.max(scale * (dist / lastDist), 1), 3);
      setScale(newScale);
      setLastDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setLastDist(null);
    if (scale < 1.1) setScale(1);
  };

  const handleDoubleTap = () => {
    setScale(prev => prev > 1 ? 1 : 2);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, text: `Regarde ce que j'ai trouvé sur Brumerie : ${product.title} à ${formatPrice(product.price)} !`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch { }
  };

  const handleWhatsAppClick = () => setShowWhatsAppModal(true);

  const handleConfirmWhatsApp = () => {
    incrementWhatsAppClick(product.id);
    window.open(generateWhatsAppLink(product.sellerPhone, product.title, product.price), '_blank');
    setShowWhatsAppModal(false);
    setContacted(true);
  };

  const createdAtDate = product.createdAt?.toDate ? product.createdAt.toDate() : new Date(product.createdAt);
  const isNew = new Date().getTime() - createdAtDate.getTime() < 48 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-white pb-32 font-sans">

      {/* Slider avec zoom */}
      <div className="relative bg-slate-100" style={{ aspectRatio: '1/1' }}>
        <div ref={scrollRef} onScroll={handleScroll}
          className="flex overflow-x-auto h-full snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {product.images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 snap-center overflow-hidden"
              ref={idx === currentImageIndex ? imgRef : null}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleTap}
              style={{ cursor: scale > 1 ? 'grab' : 'zoom-in' }}
              onClick={() => { if (scale <= 1) { setLightboxIndex(idx); setLightboxOpen(true); } }}
            >
              <img src={img || 'https://via.placeholder.com/600'} alt={`${product.title} - ${idx}`}
                className="w-full h-full object-cover transition-transform duration-200"
                style={{ transform: idx === currentImageIndex ? `scale(${scale})` : 'scale(1)', transformOrigin: 'center center' }}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Hint zoom */}
        {scale === 1 && product.images.length > 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
            <p className="text-[9px] text-white font-bold">Tap pour agrandir · Pincer pour zoomer</p>
          </div>
        )}

        {/* Boutons flottants */}
        <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-10">
          <button onClick={onBack} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border border-slate-100">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#0F172A" strokeWidth="3">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex gap-2">
            {/* Bouton Favoris sur la page détail — synchronisé */}
            <button onClick={handleBookmark} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border border-slate-100">
              <svg width="20" height="20" viewBox="0 0 24 24"
                fill={isBookmarked ? '#1D9BF0' : 'none'}
                stroke={isBookmarked ? '#1D9BF0' : '#0F172A'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button onClick={handleShare} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border border-slate-100">
              {copySuccess ? (
                <span className="text-[10px] font-black text-green-600 uppercase">OK</span>
              ) : (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0F172A" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-24 right-6 flex flex-col gap-2 z-10">
          {isNew && <span className="bg-green-600 text-white text-[9px] font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-widest">NOUVEAU</span>}
          {product.status === 'sold' && <span className="bg-slate-900 text-white text-[9px] font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-widest">VENDU</span>}
        </div>

        {/* Dots navigation */}
        {product.images.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            {product.images.map((_, idx) => (
              <button key={idx} onClick={() => scrollToImage(idx)}
                className={`rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-5 h-2' : 'bg-white/40 w-2 h-2'}`} />
            ))}
          </div>
        )}
        <div className="absolute bottom-6 left-6 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{currentImageIndex + 1} / {product.images.length}</p>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 py-8 animate-fade-up">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="price-brumerie text-[38px] text-slate-900" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, letterSpacing: '-0.04em' }}>
              {product.price.toLocaleString('fr-FR')} <span className="text-[20px] text-slate-400 font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>FCFA</span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <span className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#94A3B8"><path d="M12 2a8 8 0 00-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
                {product.neighborhood}
              </span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{formatRelativeDate(product.createdAt)}</span>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-700 text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">
            {CATEGORIES_MAP[product.category] || product.category}
          </span>
        </div>

        {/* Titre visible et contrasté */}
        <h1 className="text-2xl font-black text-slate-900 mb-6 leading-tight uppercase">
          {product.title}
        </h1>

        {/* Description avec bon contraste */}
        <div className="bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Description</p>
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {product.description || 'Aucune description fournie.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-[2rem] p-5 text-center border border-slate-100 shadow-sm">
            <p className="price-brumerie text-2xl text-slate-900">{product.whatsappClickCount || 0}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Intérêts</p>
          </div>
          <div className="bg-white rounded-[2rem] p-5 text-center border border-slate-100 shadow-sm">
            <p className={`text-lg font-black ${product.status === 'sold' ? 'text-red-500' : 'text-green-600'}`}>
              {product.status === 'sold' ? 'Vendu' : 'Disponible'}
            </p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Statut</p>
          </div>
        </div>

        {/* Seller Card */}
        <button onClick={() => onSellerClick(product.sellerId)}
          className="w-full bg-slate-900 rounded-[2.5rem] p-6 flex items-center gap-5 active:scale-95 transition-all shadow-2xl">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/20 shrink-0">
            {product.sellerPhoto ? (
              <img src={product.sellerPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-green-500 text-white text-xl font-black">
                {product.sellerName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-white text-sm uppercase tracking-tight">{product.sellerName}</span>
              {product.sellerVerified && (
                <div style={{ width: 18, height: 18, background: '#1D9BF0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>
            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Voir la boutique →</p>
          </div>
        </button>
      </div>

      {/* FIXED FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="flex justify-center pt-3 px-6">
          <button onClick={() => {
            const subject = encodeURIComponent('Signalement produit - Brumerie');
            const body = encodeURIComponent(`Bonjour,\n\nJe souhaite signaler :\nTitre : ${product.title}\nVendeur : ${product.sellerName}\nRaison : [Décris ici le problème]`);
            window.open(`mailto:brumerieciv.email@gmail.com?subject=${subject}&body=${body}`, '_blank');
          }} className="report-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Signaler cette annonce
          </button>
        </div>
        <div className="p-4 pt-2">
          {product.status === 'sold' ? (
            <div className="w-full py-5 rounded-2xl bg-slate-100 text-slate-300 font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center">
              VENDU
            </div>
          ) : currentUser?.uid === product.sellerId ? (
            <div className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center">
              Ton annonce
            </div>
          ) : (
            <div className="flex gap-3">
              {/* Bouton Discuter */}
              <button onClick={handleStartChat} disabled={startingChat}
                className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-100 text-slate-700 active:scale-95 transition-all disabled:opacity-50">
                {startingChat
                  ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Discuter</>
                }
              </button>
              {/* Bouton Acheter */}
              <button
                onClick={() => onBuyClick?.(product)}
                className="flex-[2] py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-xl shadow-green-200 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #16A34A, #115E2E)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Acheter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp remplacé par messagerie interne — Sprint 2 */}

      {/* Lightbox plein écran */}
      {lightboxOpen && (
        <ImageLightbox
          images={product.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
