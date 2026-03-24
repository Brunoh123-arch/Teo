import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, History, Star, Settings, Car, LogOut, ShieldAlert, FileText, Wallet, HelpCircle, Bell, Gift, Tag, TrendingUp } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { IosSwitch } from './IosSwitch';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  appMode: 'rider' | 'driver';
  onToggleAppMode: () => void;
  onOpenLogin: () => void;
  onOpenHistory: () => void;
  onOpenWallet: () => void;
  onOpenVehicleProfile: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onOpenPrivacy: () => void;
  onOpenSupport: () => void;
  onOpenSafetyCenter: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  onOpenVerification?: () => void;
  onOpenNotifications: () => void;
  onOpenSavedPlaces: () => void;
  onOpenReferral: () => void;
  onOpenPromo: () => void;
  onOpenEarnings: () => void;
  driverStatus?: string;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
}

const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style });
  }
};

export const SideMenu: React.FC<MenuProps> = ({
  isOpen,
  onClose,
  user,
  appMode,
  onToggleAppMode,
  onOpenLogin,
  onOpenHistory,
  onOpenWallet,
  onOpenVehicleProfile,
  onOpenProfile,
  onLogout,
  onDeleteAccount,
  onOpenPrivacy,
  onOpenSupport,
  onOpenSafetyCenter,
  isAdmin,
  onOpenAdmin,
  onOpenVerification,
  onOpenNotifications,
  onOpenSavedPlaces,
  onOpenReferral,
  onOpenPromo,
  onOpenEarnings,
  driverStatus,
  notificationsEnabled,
  onToggleNotifications,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 z-10 pointer-events-auto"
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 left-0 w-80 bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl z-20 shadow-2xl flex flex-col pointer-events-auto border-r border-white/50"
            style={{ 
              paddingTop: 'var(--safe-top)',
              paddingBottom: 'var(--safe-bottom)',
              paddingLeft: 'var(--safe-left)'
            }}
          >
            <div className="p-8 bg-[var(--system-background)] border-b border-gray-100 flex flex-col items-start gap-4">
              {user ? (
                <button 
                  onClick={() => {
                    triggerHaptic();
                    onOpenProfile();
                    onClose();
                  }}
                  className="flex flex-col items-start gap-4 w-full text-left hover:opacity-80 transition-opacity"
                >
                  <img
                    src={user.photoURL || ""}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border-2 border-white shadow-md"
                  />
                  <div>
                    <h2 className="font-semibold text-xl text-[var(--system-label)]">{user.displayName}</h2>
                    <p className="text-sm text-[var(--system-secondary-label)]">{user.email}</p>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col items-start gap-4 w-full">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-[var(--system-secondary-label)]" />
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      onOpenLogin();
                    }}
                    className="bg-[var(--system-blue)] text-white px-6 py-3 rounded-2xl font-semibold w-full text-center shadow-sm"
                  >
                    Entrar
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
              {[
                { icon: History, label: 'Suas viagens', action: onOpenHistory },
                { icon: Wallet, label: 'Carteira', action: onOpenWallet },
                { icon: Star, label: 'Locais salvos', action: onOpenSavedPlaces },
                { icon: Gift, label: 'Indique e Ganhe', action: onOpenReferral },
                { icon: Tag, label: 'Promoções', action: onOpenPromo },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    triggerHaptic();
                    item.action();
                    onClose();
                  }}
                  className="ios-list-item w-full"
                >
                  <item.icon className="w-6 h-6 text-[var(--system-blue)] mr-4" />
                  <span className="font-semibold text-[var(--system-label)] text-lg">{item.label}</span>
                </button>
              ))}
              
              <div className="ios-list-item w-full justify-between">
                <div className="flex items-center">
                  <Bell className="w-6 h-6 text-[var(--system-blue)] mr-4" />
                  <span className="font-semibold text-[var(--system-label)] text-lg">Notificações</span>
                </div>
                <IosSwitch checked={notificationsEnabled} onChange={onToggleNotifications} />
              </div>
              
              {appMode === "driver" && (
                <>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      onOpenEarnings();
                      onClose();
                    }}
                    className="ios-list-item w-full"
                  >
                    <TrendingUp className="w-6 h-6 text-[var(--system-blue)] mr-4" />
                    <span className="font-semibold text-[var(--system-label)] text-lg">Ganhos</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      onOpenVehicleProfile();
                      onClose();
                    }}
                    className="ios-list-item w-full"
                  >
                    <Settings className="w-6 h-6 text-[var(--system-blue)] mr-4" />
                    <span className="font-semibold text-[var(--system-label)] text-lg">Perfil do Veículo</span>
                  </button>
                </>
              )}
              
              <div className="my-2 border-t border-gray-100" />
              
              <button
                onClick={() => {
                  triggerHaptic();
                  onOpenPrivacy();
                  onClose();
                }}
                className="ios-list-item w-full"
              >
                <FileText className="w-6 h-6 text-[var(--system-secondary-label)] mr-4" />
                <span className="font-semibold text-[var(--system-label)] text-lg">Privacidade</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  onOpenSupport();
                  onClose();
                }}
                className="ios-list-item w-full"
              >
                <HelpCircle className="w-6 h-6 text-[var(--system-secondary-label)] mr-4" />
                <span className="font-semibold text-[var(--system-label)] text-lg">Suporte</span>
              </button>
            </div>

            {user && (
              <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
                <button
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    onToggleAppMode();
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-blue-50 text-blue-600 rounded-lg w-full text-left"
                >
                  <Car className="w-5 h-5" />
                  <span className="font-medium">
                    Mudar para Modo {appMode === "rider" ? "Motorista" : "Passageiro"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic();
                    onLogout();
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-lg w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    onDeleteAccount();
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-red-100 text-red-700 rounded-lg w-full text-left mt-2"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="font-medium">Excluir Conta</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
