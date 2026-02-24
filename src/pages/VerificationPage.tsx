import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { requestVerificationViaWhatsApp } from '@/services/productService';
import { VERIFICATION_PRICE } from '@/types';

interface VerificationPageProps {
  onBack: () => void;
}

const STEPS_INFO = [
  { icon: 'whatsapp', title: 'Contact WhatsApp', desc: "Discute avec notre équipe pour lancer ta vérification en un clic." },
  { icon: 'doc', title: 'Envoi des documents', desc: "Fournis une pièce d'identité valide pour garantir ton authenticité." },
  { icon: 'card', title: 'Paiement Sécurisé', desc: `Règlement via Mobile Money après validation de tes documents.` },
];

export function VerificationPage({ onBack }: VerificationPageProps) {
  const { userProfile } = useAuth();
  const [sent, setSent] = useState(false);

  const handleRequest = () => {
    if (!userProfile) return;
    const msg = `Bonjour Brumerie ! 👋\n\nJe souhaite profiter de l'offre : "1er MOIS GRATUIT" pour le Badge Vendeur Vérifié.\n\nNom : ${userProfile.name}\nEmail : ${userProfile.email}`;
    window.open(`https://wa.me/2250586867693?text=${encodeURIComponent(msg)}`, '_blank');
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
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
        <h1 className="font-bold text-sm uppercase tracking-widest text-slate-900">Badge de Confiance</h1>
      </div>

      <div className="px-6 py-8 animate-fade-up">
        {/* Hero Card : L'OFFRE FLASH */}
        <div
          className="rounded-[3rem] p-8 mb-10 relative overflow-hidden shadow-2xl shadow-green-200"
          style={{ background: 'linear-gradient(135deg, #115E2E 0%, #16A34A 100%)' }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl mx-auto mb-6 rotate-3">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9BF0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            </div>
            <h2 className="text-white text-3xl font-black leading-none tracking-tighter mb-2 uppercase italic">
              1 MOIS GRATUIT
            </h2>
            <p className="text-green-100 text-[11px] font-bold uppercase tracking-[0.2em] mb-6 opacity-90">
              Offre de bienvenue vendeur 2.0
            </p>
            
            <div className="bg-black/20 backdrop-blur-md rounded-2xl py-3 px-4 inline-block">
              <p className="text-white font-black text-lg">Puis {VERIFICATION_PRICE.toLocaleString('fr-FR')} FCFA / mois</p>
            </div>
          </div>
        </div>

        {userProfile?.isVerified ? (
          <div className="bg-white rounded-[2.5rem] p-10 text-center border-4 border-green-500 shadow-xl animate-bounce-short">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M5 20V10l7-6 7 6v10"/><polyline points="12,4 12,10"/></svg></div>
            <h3 className="font-black text-slate-900 text-xl uppercase italic">Vendeur d'Élite</h3>
            <p className="text-slate-400 text-[11px] font-bold mt-2 uppercase">Ton badge est actif et visible</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Les Bénéfices */}
            <div className="space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Pourquoi devenir vérifié ?</p>
               <div className="grid gap-3">
                  {[
                    { t: 'Confiance Maximale', d: 'Les acheteurs préfèrent les profils avec le badge ✓.', i: 'trust' },
                    { t: 'Visibilité Boostée', d: 'Tes articles remontent en haut de la liste.', i: 'boost' },
                    { t: 'Sérieux Garanti', d: 'Prouve que tu es un vrai business légal.', i: 'shield' }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0">
                        {item.i}
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-slate-900 leading-none mb-1">{item.t}</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight">{item.d}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Le Processus 1-2-3 */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Le processus (Simple & Rapide)</p>
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="space-y-8 relative">
                  {/* Ligne verticale de liaison */}
                  <div className="absolute left-[23px] top-2 bottom-2 w-1 bg-slate-50" />
                  
                  {STEPS_INFO.map((step, i) => (
                    <div key={i} className="flex items-start gap-5 relative z-10">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-black shadow-lg">
                        {step.icon === 'whatsapp' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M11.99 2C6.465 2 2.011 6.46 2.011 11.985a9.916 9.916 0 001.337 5.003L2 22l5.16-1.321a9.955 9.955 0 004.83 1.24c5.524 0 9.979-4.452 9.979-9.977A9.97 9.97 0 0011.99 2z"/></svg> : step.icon === 'doc' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
                      </div>
                      <div className="pt-1">
                        <p className="font-black text-slate-900 text-xs uppercase tracking-tight">
                          <span className="text-green-600 mr-2">{i + 1}.</span>
                          {step.title}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-1 font-bold leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Final */}
            <div className="pt-4">
              {sent ? (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center animate-fade-up shadow-2xl">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4 mx-auto"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
                  <p className="text-white font-black uppercase text-sm italic">Ouverture de WhatsApp...</p>
                  <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Envoie le message pour valider ton mois gratuit !</p>
                </div>
              ) : (
                <button
                  onClick={handleRequest}
                  className="w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[13px] text-white shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                  style={{ 
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    boxShadow: '0 20px 40px rgba(37,211,102,0.3)' 
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="white" className="group-hover:rotate-12 transition-transform">
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.82.736 5.469 2.027 7.766L0 32l8.437-2.016A15.942 15.942 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.091c-2.65 0-5.116-.71-7.228-1.943l-.518-.307-5.01 1.197 1.239-4.859-.338-.527A12.987 12.987 0 013.014 16C3.014 8.902 8.902 3.014 16 3.014S28.986 8.902 28.986 16 23.098 29.086 16 29.086v.005z"/>
                  </svg>
                  <span>Activer mon mois gratuit</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
