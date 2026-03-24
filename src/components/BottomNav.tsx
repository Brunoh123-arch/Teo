import React from 'react';
import { Map, History, User, Settings } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const triggerHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
};

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'map', label: 'Mapa', icon: Map },
    { id: 'history', label: 'Viagens', icon: History },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--system-secondary-background)]/80 backdrop-blur-2xl border-t border-[var(--system-separator)] pb-[var(--safe-bottom)] z-[1000]">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic();
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 active:scale-90 ${isActive ? 'text-[var(--system-blue)]' : 'text-[var(--system-secondary-label)]'}`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[var(--system-blue)]/10' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'fill-[var(--system-blue)]/20' : ''}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-[var(--system-blue)]' : 'text-[var(--system-secondary-label)]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
