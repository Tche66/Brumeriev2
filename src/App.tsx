// src/App.tsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { SellPage } from '@/pages/SellPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SellerProfilePage } from '@/pages/SellerProfilePage';
import { EditProfilePage } from '@/pages/EditProfilePage';
import { VerificationPage } from '@/pages/VerificationPage';
import { SupportPage } from '@/pages/SupportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { BottomNav } from '@/components/BottomNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { Product } from '@/types';

type Page =
  | 'home' | 'profile' | 'sell'
  | 'product-detail' | 'seller-profile'
  | 'edit-profile' | 'verification' | 'support'
  | 'settings' | 'privacy' | 'terms' | 'about';


function AuthGate() {
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [privacyMode, setPrivacyMode] = React.useState<'privacy' | 'terms'>('privacy');

  const handleNavigate = (page: string) => {
    if (page === 'privacy') { setPrivacyMode('privacy'); setShowPrivacy(true); }
    else if (page === 'terms') { setPrivacyMode('terms'); setShowPrivacy(true); }
  };

  if (showPrivacy) {
    return <PrivacyPage onBack={() => setShowPrivacy(false)} isTerms={privacyMode === 'terms'} />;
  }
  return <AuthPage onNavigate={handleNavigate} />;
}

function AppContent() {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Page[]>(['home']);

  useEffect(() => { window.scrollTo(0, 0); }, [activePage, selectedProduct]);

  if (!currentUser) return <AuthGate />;

  const MAIN_PAGES: Page[] = ['home', 'profile', 'sell'];

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

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
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
        {activePage === 'profile' && (
          <ProfilePage onProductClick={handleProductClick} onNavigate={(p) => navigate(p as Page)} />
        )}
        {activePage === 'edit-profile' && <EditProfilePage onBack={goBack} onSaved={goBack} />}
        {activePage === 'settings' && <SettingsPage onBack={goBack} onNavigate={(p) => navigate(p as Page)} />}
        {activePage === 'verification' && <VerificationPage onBack={goBack} />}
        {activePage === 'support' && <SupportPage onBack={goBack} />}
        {activePage === 'privacy' && <PrivacyPage onBack={goBack} />}
        {activePage === 'terms' && <PrivacyPage onBack={goBack} isTerms />}
        {activePage === 'about' && <PrivacyPage onBack={goBack} isAbout />}
        {activePage === 'sell' && (
          <SellPage onClose={() => handleBottomNavNavigate('home')} onSuccess={() => handleBottomNavNavigate('home')} />
        )}
      </main>

      {MAIN_PAGES.includes(activePage) && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav activePage={activePage} onNavigate={handleBottomNavNavigate} />
        </div>
      )}

      <PWAInstallBanner />
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
