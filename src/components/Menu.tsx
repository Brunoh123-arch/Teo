import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, History, Star, Settings, Car, LogOut, ShieldAlert, FileText, Wallet, HelpCircle, Bell, Gift, Tag, TrendingUp, X } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 bottom-0 left-0 w-80 bg-white/95 z-20 shadow-2xl overflow-y-auto"
          >
            <div className="p-8 bg-white border-b border-gray-100">
              {user ? (
                <button 
                  onClick={() => { onOpenProfile(); onClose(); }}
                  className="flex flex-col items-start gap-4"
                >
                  <img src={user.photoURL || ""} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-white" />
                  <div>
                    <p className="text-xl font-semibold text-gray-900">{user.displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={32} className="text-gray-500" />
                  </div>
                  <button
                    onClick={() => { onOpenLogin(); onClose(); }}
                    className="bg-blue-600 px-6 py-3 rounded-2xl w-full text-center text-white font-bold text-base"
                  >
                    Entrar
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 space-y-2">
              {[
                { icon: History, label: 'Suas viagens', action: onOpenHistory },
                { icon: Wallet, label: 'Carteira', action: onOpenWallet },
                { icon: Star, label: 'Locais salvos', action: onOpenSavedPlaces },
                { icon: Gift, label: 'Indique e Ganhe', action: onOpenReferral },
                { icon: Tag, label: 'Promoções', action: onOpenPromo },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => { item.action(); onClose(); }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 w-full"
                >
                  <item.icon size={24} className="text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">{item.label}</span>
                </button>
              ))}
              
              <div className="flex items-center justify-between p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <Bell size={24} className="text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">Notificações</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationsEnabled} 
                  onChange={(e) => onToggleNotifications(e.target.checked)}
                  className="toggle toggle-primary"
                />
              </div>
              
              {appMode === "driver" && (
                <>
                  <button
                    onClick={() => { onOpenEarnings(); onClose(); }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 w-full"
                  >
                    <TrendingUp size={24} className="text-blue-600" />
                    <span className="text-lg font-semibold text-gray-900">Ganhos</span>
                  </button>
                  <button
                    onClick={() => { onOpenVehicleProfile(); onClose(); }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 w-full"
                  >
                    <Settings size={24} className="text-blue-600" />
                    <span className="text-lg font-semibold text-gray-900">Perfil do Veículo</span>
                  </button>
                </>
              )}
              
              <div className="h-px bg-gray-100 my-2" />
              
              <button
                onClick={() => { onOpenPrivacy(); onClose(); }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 w-full"
              >
                <FileText size={24} className="text-gray-500" />
                <span className="text-lg font-semibold text-gray-900">Privacidade</span>
              </button>
              <button
                onClick={() => { onOpenSupport(); onClose(); }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 w-full"
              >
                <HelpCircle size={24} className="text-gray-500" />
                <span className="text-lg font-semibold text-gray-900">Suporte</span>
              </button>
            </div>

            {user && (
              <div className="p-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => { onToggleAppMode(); onClose(); }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-blue-600"
                >
                  <Car size={20} />
                  <span className="text-base font-medium">
                    Mudar para Modo {appMode === "rider" ? "Motorista" : "Passageiro"}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-red-600"
                >
                  <LogOut size={20} />
                  <span className="text-base font-medium">Sair</span>
                </button>
                <button
                  onClick={onDeleteAccount}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-red-700"
                >
                  <ShieldAlert size={20} />
                  <span className="text-base font-medium">Excluir Conta</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
