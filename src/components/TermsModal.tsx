import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onAccept }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex flex-col justify-end pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full rounded-t-3xl p-6 relative z-10 shadow-2xl flex flex-col items-center border-t border-white/50"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-6" />
            <h2 className="text-xl font-bold mb-4 text-[var(--system-label)]">Termos de Uso</h2>
            <div className="h-64 overflow-y-auto mb-6 text-sm text-[var(--system-secondary-label)] space-y-4">
              <p>Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.</p>
              <p>Este aplicativo coleta dados de localização para fornecer serviços de transporte.</p>
              <p>Você pode excluir sua conta a qualquer momento nas configurações.</p>
            </div>
            <button
              onClick={onAccept}
              className="w-full bg-[var(--system-blue)] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:opacity-90 transition-opacity pb-[env(safe-area-inset-bottom,24px)]"
            >
              Aceitar Termos
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
