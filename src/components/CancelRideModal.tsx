import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const CancelRideModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (reason: string) => void }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
    }
  };

  const handleConfirm = () => {
    if (!reason) {
      toast.error("Por favor, selecione um motivo.");
      return;
    }
    setSubmitting(true);
    triggerHaptic(ImpactStyle.Medium);
    onConfirm(reason);
    onClose();
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex flex-col justify-end">
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
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full rounded-t-3xl relative z-10 p-6 shadow-2xl border-t border-white/50"
          >
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <h3 className="font-bold text-lg flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Cancelar Viagem
                </h3>
                <button
                  onClick={() => {
                    triggerHaptic();
                    onClose();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 mb-4">Tem certeza que deseja cancelar esta viagem? Isso pode gerar taxas de cancelamento.</p>

            <div className="space-y-2 mb-6">
              {['Motorista demorou', 'Mudei de ideia', 'Endereço errado', 'Outro'].map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-colors ${reason === r ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirm}
              disabled={submitting || !reason}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50"
            >
              Confirmar Cancelamento
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
