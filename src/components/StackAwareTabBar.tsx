import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, History, User, Settings, ChevronLeft } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isNested: boolean;
  onBack: () => void;
}

const triggerHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
};

export const StackAwareTabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, isNested, onBack }) => {
  const tabs = [
    { id: 'map', label: 'Mapa', icon: Map },
    { id: 'history', label: 'Viagens', icon: History },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] pb-[var(--safe-bottom)] px-4 pb-6">
      <div className="flex items-center justify-center gap-4">
        <AnimatePresence mode="wait">
          {isNested ? (
            <motion.button
              key="back"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => {
                triggerHaptic();
                onBack();
              }}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg"
            >
              <ChevronLeft className="w-6 h-6 text-black" />
            </motion.button>
          ) : null}
        </AnimatePresence>

        <motion.div
          layout
          className="flex justify-around items-center h-16 bg-[var(--system-secondary-background)]/80 backdrop-blur-2xl border border-[var(--system-separator)] rounded-full px-6 shadow-lg"
        >
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
                className={`flex flex-col items-center justify-center gap-1 px-3 transition-colors ${isActive ? 'text-[var(--system-blue)]' : 'text-[var(--system-secondary-label)]'}`}
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
        </motion.div>
      </div>
    </div>
  );
};
