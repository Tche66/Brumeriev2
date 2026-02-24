import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createProduct, canUserPublish } from '@/services/productService';
import { compressImage } from '@/utils/helpers';
import { CATEGORIES, NEIGHBORHOODS } from '@/types';

interface SellPageProps {
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['Photos', 'Infos', 'Détails'];

const Icon = ({ name }: { name: string }) => {
  if (name === 'gallery') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
  if (name === 'camera') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
  return null;
};

export function SellPage({ onClose, onSuccess }: SellPageProps) {
  const { userProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canPublish, setCanPublish] = useState(true);
  const [success, setSuccess] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState(userProfile?.neighborhood || '');

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      canUserPublish(userProfile.id).then((check) => {
        setCanPublish(check.canPublish);
        if (!check.canPublish) setError('Limite de publications atteinte.');
      });
    }
  }, [userProfile]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.length + images.length > 3) {
      setError('Maximum 3 photos autorisées.');
      return;
    }
    setError('');
    for (const file of files) {
      const compressed = await compressImage(file);
      setImages(prev => [...prev, compressed]);
      setImagePreviews(prev => [...prev, URL.createObjectURL(compressed)]);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!userProfile || !canPublish) return;
    setLoading(true);
    try {
      await createProduct({
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim(),
        category,
        neighborhood,
        sellerId: userProfile.id,
        sellerName: userProfile.name,
        sellerPhone: userProfile.phone,
        sellerPhoto: userProfile.photoURL,
        sellerVerified: userProfile.isVerified,
        images: [],
      }, images);
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-white z-[70] flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Article publié !</h2>
        <p className="text-slate-500">Ton annonce est maintenant visible par la communauté.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header Pro */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-black transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <span className="font-bold text-xs tracking-[0.2em] uppercase text-slate-900">
          {STEPS[step]}
        </span>
        <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold">
          {step + 1} / {STEPS.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 safe-area-bottom">
        {step === 0 && (
          <div className="space-y-8 animate-fade-up">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">Photos de l'article</h3>
              <p className="text-slate-400 text-sm mt-2">Le premier visuel sera la couverture.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-slate-100 shadow-sm">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full text-white flex items-center justify-center text-xs">✕</button>
                  {i === 0 && <div className="absolute bottom-0 inset-x-0 bg-green-600 py-1.5 text-[8px] text-center text-white font-bold uppercase tracking-widest">Principale</div>}
                </div>
              ))}
              {images.length < 3 && (
                <div 
                  onClick={() => galleryRef.current?.click()}
                  className="aspect-[4/5] rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 bg-slate-50 active:scale-95 transition-all"
                >
                  <span className="text-slate-300 text-3xl font-light">+</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => galleryRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200">
                <Icon name="gallery" /> Galerie
              </button>
              <button onClick={() => cameraRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-50 text-slate-900 rounded-[2rem] font-bold text-xs uppercase tracking-widest border border-slate-100 transition-all active:scale-95">
                <Icon name="camera" /> Caméra
              </button>
            </div>
            
            <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-fade-up">
            <h3 className="text-2xl font-bold text-slate-900">Informations</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Titre de l'annonce</label>
                <input type="text" placeholder="ex: iPhone 13 Pro Max" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-5 bg-slate-50 rounded-2xl text-sm border-2 border-transparent focus:border-green-600 focus:bg-white outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Prix (FCFA)</label>
                <input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-5 py-5 bg-slate-50 rounded-2xl text-lg border-2 border-transparent focus:border-green-600 focus:bg-white outline-none transition-all font-bold text-green-700" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Description</label>
                <textarea rows={4} placeholder="État, accessoires inclus, troc possible ?..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-5 py-5 bg-slate-50 rounded-2xl text-sm border-2 border-transparent focus:border-green-600 focus:bg-white outline-none transition-all resize-none" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-up">
            <h3 className="text-2xl font-bold text-slate-900">Catégorie & Lieu</h3>
            
            {/* SECTION CATÉGORIES */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">1. Choisir la catégorie</label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-[2.5rem]">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => setCategory(cat.id)} 
                    className={`py-4 px-4 rounded-2xl text-[11px] font-bold transition-all border ${
                      category === cat.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION LOCALISATION */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">2. Localisation (Abidjan)</label>
              <div className="grid grid-cols-2 gap-3 bg-green-50/50 p-4 rounded-[2.5rem] border border-green-100/50">
                {NEIGHBORHOODS.map(n => (
                  <button 
                    key={n} 
                    onClick={() => setNeighborhood(n)} 
                    className={`py-4 px-4 rounded-2xl text-[11px] font-bold transition-all border ${
                      neighborhood === n ? 'bg-green-600 border-green-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-green-50 text-green-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 animate-fade-in">
            <p className="text-red-600 text-xs font-bold text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Footer Navigation - Fixé et propre */}
      <div className="p-6 border-t border-slate-50 bg-white">
        <div className="flex gap-3">
          {step > 0 && (
            <button 
              onClick={() => setStep(step - 1)} 
              className="flex-1 py-5 rounded-[2rem] bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              Retour
            </button>
          )}
          <button 
            onClick={() => step < 2 ? setStep(step + 1) : handleSubmit()} 
            disabled={loading || (step === 0 && images.length === 0) || (step === 1 && (!title || !price))}
            className="flex-[2] py-5 rounded-[2rem] bg-green-600 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-100 disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              step === 2 ? 'Publier l\'annonce 🎉' : 'Continuer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
