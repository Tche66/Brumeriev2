// src/components/BottomNav.tsx
import React from 'react';

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  {
    id: 'home',
    label: 'Accueil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#16A34A' : 'none'} stroke={active ? '#16A34A' : '#94A3B8'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    id: 'sell',
    label: '',
    isSpecial: true,
    icon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#16A34A' : 'none'} stroke={active ? '#16A34A' : '#94A3B8'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50" style={{ maxWidth: 480, margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="flex items-center justify-around h-16 px-6">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="-translate-y-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/40 active:scale-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #115E2E, #16A34A)' }}
              >
                {item.icon(false)}
              </button>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 px-4 py-2 transition-all active:scale-90"
            >
              {item.icon(isActive)}
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* safe area for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
