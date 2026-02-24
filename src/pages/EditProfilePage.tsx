import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { NEIGHBORHOODS } from '@/types';
import { compressImage } from '@/utils/helpers';

interface EditProfilePageProps {
  onBack: () => void;
  onSaved: () => void;
}

export function EditProfilePage({ onBack, onSaved }: EditProfilePageProps) {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // --- États du formulaire ---
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [neighborhood, setNeighborhood] = useState(userProfile?.neighborhood || '');
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(
    userProfile?.neighborhood ? !NEIGHBORHOODS.slice(0, 5).includes(userProfile.neighborhood) : false
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // --- Nouveaux États Business ---
  const [hasPhysicalShop, setHasPhysicalShop] = useState(userProfile?.hasPhysicalShop || false);
  const [managesDelivery, setManagesDelivery] = useState(userProfile?.managesDelivery || false);
  const [bio, setBio] = useState(userProfile?.bio || '');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 400);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  };

  const handleSave = async () => {
    if (!currentUser || !userProfile) return;
    if (!name.trim() || !phone.trim() || !neighborhood) {
      setError('Nom, WhatsApp et Quartier obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      let photoURL = userProfile.photoURL || '';

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('upload_preset', 'brumerie_preset');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dk8kfgmqx/image/upload`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error("Échec de l'upload");
        const data = await response.json();
        photoURL = data.secure_url;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        phone: phone.trim(),
        neighborhood,
        photoURL,
        hasPhysicalShop,
        managesDelivery,
        bio: bio.trim(),
      });

      onSaved();
    } catch (err: any) {
      setError(`Erreur : ${err.message || 'Réessaie.'}`);
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = photoPreview || userProfile?.photoURL;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      {/* Header Premium */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-5 flex items-center justify-between border-b border-slate-50">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 active:scale-90 transition-all border border-slate-100">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-bold text-[11px] uppercase tracking-[0.2em] text-slate-900">
          Mon Profil
        </h1>
        <div className="w-12"/>
      </div>

      <div className="px-6 py-8 space-y-10 animate-fade-up">
        
        {/* Photo de Profil XL */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-[3rem] overflow-hidden bg-slate-50 border-4 border-white shadow-2xl">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Profil" className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-green-50">
                  <span className="text-green-600 text-5xl font-black">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all border-4 border-white"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden"/>
        </div>

        {/* Section Identité */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">Identité & Contact</p>
          <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-6 border border-slate-100/50">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 ml-1">Nom du Business ou Prénom</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Boutique de Marie"
                className="w-full px-6 py-5 bg-white border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-green-600 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 ml-1">WhatsApp</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 font-bold border-r border-slate-100 pr-3 text-sm"></span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-green-600 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Business */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">Infos Vendeur 2.0</p>
          <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-8 border border-slate-100/50">
            {/* Boutique Physique */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Boutique physique</p>
                  <p className="text-[10px] text-slate-400 font-medium">Local pour recevoir</p>
                </div>
              </div>
              <button 
                onClick={() => setHasPhysicalShop(!hasPhysicalShop)}
                className={`w-14 h-7 rounded-full transition-all relative ${hasPhysicalShop ? 'bg-green-600 shadow-lg shadow-green-100' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${hasPhysicalShop ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Livraison */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M8 17.5h7M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Livraison gérée</p>
                  <p className="text-[10px] text-slate-400 font-medium">Expédition directe</p>
                </div>
              </div>
              <button 
                onClick={() => setManagesDelivery(!managesDelivery)}
                className={`w-14 h-7 rounded-full transition-all relative ${managesDelivery ? 'bg-green-600 shadow-lg shadow-green-100' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${managesDelivery ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 ml-1">Bio / Slogan</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Décris ton activité..."
                rows={3}
                className="w-full px-6 py-5 bg-white border-none rounded-2xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-600 transition-all outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section Quartier Personnalisée */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">Localisation</p>
          {!isCustomNeighborhood ? (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-[2.5rem]">
              {NEIGHBORHOODS.slice(0, 5).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNeighborhood(n)}
                  className={`py-4.5 px-3 rounded-2xl border-2 text-[11px] font-bold transition-all ${
                    neighborhood === n && !isCustomNeighborhood
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl'
                      : 'bg-white border-white text-slate-500 shadow-sm'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setIsCustomNeighborhood(true); setNeighborhood(''); }}
                className="py-4.5 px-3 rounded-2xl border-2 border-dashed border-slate-300 text-[11px] font-bold text-slate-400 bg-white"
              >
                + Autre
              </button>
            </div>
          ) : (
            <div className="relative animate-fade-up">
              <input
                type="text"
                placeholder="Nom de ton quartier..."
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-green-600 rounded-2xl text-sm font-bold outline-none"
                autoFocus
              />
              <button 
                onClick={() => { setIsCustomNeighborhood(false); setNeighborhood(userProfile?.neighborhood || ''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-red-500 uppercase bg-red-50 px-3 py-1.5 rounded-full"
              >
                Annuler
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 p-5 rounded-2xl border border-red-100 animate-shake">
            <p className="text-red-600 text-xs font-bold text-center">{error}</p>
          </div>
        )}

        {/* Bouton Sauvegarder XL */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-6 rounded-[2.5rem] font-bold uppercase tracking-[0.25em] text-[13px] transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50"
          style={{
            background: loading ? '#f1f5f9' : 'linear-gradient(135deg, #115E2E, #16A34A)',
            color: loading ? '#94a3b8' : 'white',
            boxShadow: loading ? 'none' : '0 20px 40px rgba(22,163,74,0.3)',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <span>Synchronisation...</span>
            </div>
          ) : (
            'Enregistrer les changements'
          )}
        </button>
      </div>
    </div>
  );
}
