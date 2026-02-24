// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/userService';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { SellPage } from '@/pages/SellPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { BuyerProfilePage } from '@/pages/BuyerProfilePage';
import { SellerProfilePage } from '@/pages/SellerProfilePage';
import { EditProfilePage } from '@/pages/EditProfilePage';
import { VerificationPage } from '@/pages/VerificationPage';
import { SupportPage } from '@/pages/SupportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { RoleSelectPage } from '@/pages/RoleSelectPage';
import { BottomNav } from '@/components/BottomNav';
import { Product } from '@/types';

type Page =
  | 'home' | 'profile' | 'sell'
  | 'product-detail' | 'seller-profile'
  | 'edit-profile' | 'verification' | 'support'
  | 'settings' | 'privacy' | 'terms' | 'about';

// ── AuthGate : inscription → choix de rôle ────────────────
function AuthGate() {
  const { userProfile, currentUser } = useAuth();
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [privacyMode, setPrivacyMode] = React.useState<'privacy' | 'terms'>('privacy');
  const [roleSelected, setRoleSelected] = React.useState(false);

  const handleNavigate = (page: string) => {
    if (page === 'privacy') { setPrivacyMode('privacy'); setShowPrivacy(true); }
    else if (page === 'terms') { setPrivacyMode('terms'); setShowPrivacy(true); }
  };

  if (showPrivacy) {
    return <PrivacyPage onBack={() => setShowPrivacy(false)} isTerms={privacyMode === 'terms'} />;
  }

  // Nouvel utilisateur sans rôle défini → afficher écran de choix
  if (currentUser && userProfile && !userProfile.role && !roleSelected) {
    return (
      <RoleSelectPage
        userName={userProfile.name}
        onSelect={async (role) => {
          await updateUserProfile(currentUser.uid, { role });
          setRoleSelected(true);
        }}
      />
    );
  }

  return <AuthPage onNavigate={handleNavigate} />;
}

// ── Confirmation changement de rôle ────────────────────────
function RoleSwitchModal({ currentRole, onConfirm, onCancel }: {
  currentRole: 'buyer' | 'seller';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const newRole = currentRole === 'buyer' ? 'seller' : 'buyer';
  const isGoingSeller = newRole === 'seller';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-8 animate-slide-up">
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${isGoingSeller ? 'bg-green-50' : 'bg-blue-50'}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke={isGoingSeller ? '#16A34A' : '#3B82F6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isGoingSeller
              ? <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>
              : <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>
            }
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight mb-2">
          Passer en mode {isGoingSeller ? 'Vendeur' : 'Acheteur'}
        </h3>
        <p className="text-slate-400 text-[11px] text-center font-medium mb-8 leading-relaxed">
          {isGoingSeller
            ? 'Tu pourras publier des articles et gérer ta boutique.'
            : 'Tu passeras en mode exploration. Tes articles restent sauvegardés.'}
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm}
            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all text-white shadow-xl ${isGoingSeller ? 'bg-green-600 shadow-green-200' : 'bg-blue-500 shadow-blue-200'}`}>
            Confirmer le changement
          </button>
          <button onClick={onCancel} className="w-full py-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AppContent principal ────────────────────────────────────
function AppContent() {
  const { currentUser, userProfile } = useAuth();
  const [activePage, setActivePage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Page[]>(['home']);
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);

  React.useEffect(() => { window.scrollTo(0, 0); }, [activePage, selectedProduct]);

  if (!currentUser) return <AuthGate />;

  // Utilisateur connecté mais sans rôle → choix de rôle
  if (userProfile && !userProfile.role) {
    return (
      <RoleSelectPage
        userName={userProfile.name}
        onSelect={async (role) => {
          await updateUserProfile(currentUser.uid, { role });
          window.location.reload();
        }}
      />
    );
  }

  const role = userProfile?.role || 'buyer';
  const isBuyer = role === 'buyer';

  // Pages principales selon le rôle
  const MAIN_PAGES: Page[] = isBuyer ? ['home', 'profile'] : ['home', 'sell', 'profile'];

  const navigate = (page: Page) => {
    setNavigationHistory(prev => [...prev, page]);
    setActivePage(page);
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const h = [...navigationHistory]; h.pop();
      setNavigationHistory(h);
      setActivePage(h[h.length - 1]);
    } else { setActivePage('home'); }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product); navigate('product-detail');
  };
  const handleSellerClick = (sellerId: string) => {
    setSelectedSellerId(sellerId); navigate('seller-profile');
  };
  const handleBottomNavNavigate = (page: string) => {
    setSelectedProduct(null); setSelectedSellerId(null);
    setNavigationHistory([page as Page]); setActivePage(page as Page);
  };

  // Gestion du switch de rôle depuis les paramètres / profil
  const handleNavigate = (p: string) => {
    if (p === 'switch-to-seller' || p === 'switch-to-buyer') {
      setShowRoleSwitch(true);
      return;
    }
    navigate(p as Page);
  };

  const handleRoleSwitch = async () => {
    if (!currentUser || !userProfile) return;
    const newRole = role === 'buyer' ? 'seller' : 'buyer';
    await updateUserProfile(currentUser.uid, { role: newRole });
    setShowRoleSwitch(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {activePage === 'home' && (
          <HomePage onProductClick={handleProductClick} onProfileClick={() => navigate('profile')} />
        )}
        {activePage === 'product-detail' && selectedProduct && (
          <ProductDetailPage product={selectedProduct} onBack={goBack} onSellerClick={handleSellerClick} />
        )}
        {activePage === 'seller-profile' && selectedSellerId && (
          <SellerProfilePage sellerId={selectedSellerId} onBack={goBack} onProductClick={handleProductClick} />
        )}

        {/* Profil selon le rôle */}
        {activePage === 'profile' && isBuyer && (
          <BuyerProfilePage onProductClick={handleProductClick} onNavigate={handleNavigate} />
        )}
        {activePage === 'profile' && !isBuyer && (
          <ProfilePage onProductClick={handleProductClick} onNavigate={handleNavigate} />
        )}

        {activePage === 'edit-profile' && <EditProfilePage onBack={goBack} onSaved={goBack} />}
        {activePage === 'settings' && (
          <SettingsPage onBack={goBack} onNavigate={handleNavigate} role={role} />
        )}
        {activePage === 'verification' && <VerificationPage onBack={goBack} />}
        {activePage === 'support' && <SupportPage onBack={goBack} />}
        {activePage === 'privacy' && <PrivacyPage onBack={goBack} />}
        {activePage === 'terms' && <PrivacyPage onBack={goBack} isTerms />}
        {activePage === 'about' && <PrivacyPage onBack={goBack} isAbout />}
        {activePage === 'sell' && !isBuyer && (
          <SellPage onClose={() => handleBottomNavNavigate('home')} onSuccess={() => handleBottomNavNavigate('home')} />
        )}
      </main>

      {MAIN_PAGES.includes(activePage) && (
        <BottomNav activePage={activePage} onNavigate={handleBottomNavNavigate} role={role} />
      )}

      {/* Modal changement de rôle */}
      {showRoleSwitch && userProfile && (
        <RoleSwitchModal
          currentRole={role}
          onConfirm={handleRoleSwitch}
          onCancel={() => setShowRoleSwitch(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
