import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full sm:max-w-md bg-white/95 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col items-center"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-6" />
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Excluir sua conta?</h2>
            <p className="text-gray-500 text-center mb-6 text-base">
              Esta ação é irreversível. Todos os seus dados, histórico de viagens e documentos serão removidos permanentemente.
            </p>
            
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={onConfirm}
                className="w-full bg-red-600 py-4 rounded-2xl flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <span className="text-white font-bold text-base">Sim, excluir permanentemente</span>
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 py-4 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-900 font-bold text-base">Cancelar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
