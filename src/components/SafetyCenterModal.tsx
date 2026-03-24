import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Share2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const SafetyCenterModal = ({ isOpen, onClose, onShareRide }: { isOpen: boolean, onClose: () => void, onShareRide: () => void }) => {
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
    }
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
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full rounded-t-3xl relative z-10 max-h-[90vh] flex flex-col shadow-2xl border-t border-white/50"
          >
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--system-label)]">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Centro de Segurança
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <button
                onClick={() => {
                  triggerHaptic(ImpactStyle.Heavy);
                  window.location.href = 'tel:190';
                }}
                className="w-full bg-red-600 text-white p-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-red-200"
              >
                <AlertTriangle className="w-6 h-6" />
                Ligar para Emergência (190)
              </button>

              <button
                onClick={() => {
                  triggerHaptic(ImpactStyle.Medium);
                  onShareRide();
                }}
                className="w-full bg-blue-50 text-blue-700 p-6 rounded-2xl font-bold flex items-center justify-between border border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-6 h-6" />
                  <span>Compartilhar Viagem</span>
                </div>
              </button>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Contatos de Emergência
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">Polícia Militar</p>
                        <p className="text-xs text-gray-500">190</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = 'tel:190'}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">SAMU</p>
                        <p className="text-xs text-gray-500">192</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = 'tel:192'}
                      className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">Bombeiros</p>
                        <p className="text-xs text-gray-500">193</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = 'tel:193'}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-3">Dicas de Segurança</h4>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                  <li>Verifique a placa e o modelo do carro antes de entrar.</li>
                  <li>Confirme o nome do motorista.</li>
                  <li>Sempre use o cinto de segurança.</li>
                  <li>Compartilhe sua viagem com amigos ou familiares.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
