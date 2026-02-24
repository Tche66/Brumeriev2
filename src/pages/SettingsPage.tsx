import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

function SettingItem({ icon, label, sublabel, onClick, danger, badge }: {
  icon: React.ReactNode; label: string; sublabel?: string;
  onClick: () => void; danger?: boolean; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-5 hover:bg-slate-50 active:bg-slate-100 transition-all text-left group"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 transition-transform group-active:scale-90 ${danger ? 'bg-red-50' : 'bg-slate-50'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold tracking-tight ${danger ? 'text-red-500' : 'text-slate-900'}`}>{label}</p>
        {sublabel && <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{sublabel}</p>}
      </div>
      {badge && (
        <span className="text-[9px] font-black bg-green-600 text-white px-3 py-1 rounded-full shadow-lg shadow-green-100 mr-1 uppercase tracking-widest">
          {badge}
        </span>
      )}
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className={danger ? 'text-red-200' : 'text-slate-200'}>
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="px-6 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 divide-y divide-slate-50">
        {children}
      </div>
    </div>
  );
}

export function SettingsPage({ onBack, onNavigate }: SettingsPageProps) {
  const { userProfile, signOut } = useAuth();

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Header Premium */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-5 flex items-center gap-4 border-b border-slate-100">
        <button 
          onClick={handleBack} 
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 active:scale-90 transition-all"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-bold text-sm uppercase tracking-widest text-slate-900">Paramètres</h1>
      </div>

      <div className="px-5 pt-8">
        {/* User Summary Card */}
        <div className="bg-white rounded-[2.5rem] p-6 mb-10 flex items-center gap-5 border border-slate-100 shadow-2xl shadow-slate-200/40">
          <div className="w-16 h-16 rounded-[1.8rem] overflow-hidden bg-green-50 border-4 border-white shadow-inner">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-green-600 font-black text-2xl">{userProfile?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-base truncate tracking-tight">{userProfile?.name}</p>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter truncate">{userProfile?.email}</p>
          </div>
          {userProfile?.isVerified && (
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          )}
        </div>

        <SettingSection title="Mon compte">
          <SettingItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Modifier mon profil"
            sublabel="Nom, photo, téléphone, quartier"
            onClick={() => onNavigate('edit-profile')}
          />
          <SettingItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9BF0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>} label="Badge Vendeur Vérifié"
            sublabel={userProfile?.isVerified ? 'Ton badge est actif' : 'Boost ta crédibilité pour 2 000 FCFA'}
            onClick={() => onNavigate('verification')}
            badge={userProfile?.isVerified ? '✓ ACTIF' : undefined}
          />
        </SettingSection>

        <SettingSection title="Informations">
          <SettingItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} label="Confidentialité"
            sublabel="Protection de tes données"
            onClick={() => onNavigate('privacy')}
          />
          <SettingItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>} label="Conditions d'utilisation"
            sublabel="Les règles de Brumerie"
            onClick={() => onNavigate('terms')}
          />
          <SettingItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>} label="À propos"
            sublabel="MVP 1.0 · Fait à Abidjan 🇨🇮"
            onClick={() => onNavigate('about')}
          />
        </SettingSection>

        <SettingSection title="Assistance">
          <SettingItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} label="Support & Aide"
            sublabel="FAQ et suggestions"
            onClick={() => onNavigate('support')}
          />
        </SettingSection>

        <div className="mt-10 px-2">
          <button
            onClick={() => {
              if(confirm('Voulez-vous vous déconnecter ?')) signOut();
            }}
            className="w-full py-5 rounded-[2rem] bg-red-50 border-2 border-red-100 text-red-500 font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all"
          >
            Se déconnecter
          </button>
        </div>

        <p className="text-center text-[9px] font-black text-slate-300 mt-12 mb-8 uppercase tracking-[0.3em]">
          Brumerie ® 2024 · Abidjan
        </p>
      </div>
    </div>
  );
}
