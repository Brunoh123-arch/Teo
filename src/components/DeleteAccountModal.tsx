import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[4000] flex flex-col justify-end pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full rounded-t-3xl p-6 relative z-10 shadow-2xl flex flex-col items-center text-center border-t border-white/50"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-6" />
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-bold text-xl text-[var(--system-label)] mb-2">Excluir sua conta?</h3>
            <p className="text-[var(--system-secondary-label)] mb-6">
              Esta ação é irreversível. Todos os seus dados, histórico de viagens e documentos serão removidos permanentemente.
            </p>
            
            <div className="flex flex-col gap-3 w-full pb-[env(safe-area-inset-bottom,24px)]">
              <button
                onClick={onConfirm}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Sim, excluir permanentemente
              </button>
              <button
                onClick={onClose}
                className="w-full bg-[var(--system-tertiary-background)] text-[var(--system-label)] font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
