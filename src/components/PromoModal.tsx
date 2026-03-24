import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket, Tag, Check, ArrowRight, Gift, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { rideService } from '../services/rideService';

export const PromoModal = ({ isOpen, onClose, onApplyCoupon }: { isOpen: boolean, onClose: () => void, onApplyCoupon: (code: string) => Promise<void> }) => {
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [activePromos] = useState([
    { id: 1, title: 'Primeira Corrida', description: 'Ganhe 50% de desconto na sua primeira viagem.', code: 'PRIMEIRA50', discount: '50%', type: 'percent' },
    { id: 2, title: 'Fim de Semana', description: 'R$ 5,00 de desconto em corridas no sábado e domingo.', code: 'FDS5', discount: 'R$ 5,00', type: 'fixed' },
  ]);

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
    }
  };

  const handleApply = async (code: string) => {
    setApplying(true);
    triggerHaptic(ImpactStyle.Medium);
    try {
      await onApplyCoupon(code);
      toast.success(`Cupom ${code} aplicado com sucesso!`);
      setCouponCode('');
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Cupom inválido ou expirado.");
    } finally {
      setApplying(false);
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
                <h3 className="font-bold text-lg text-[var(--system-label)]">Promoções e Cupons</h3>
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

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Adicionar Código</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Digite o código"
                      className="w-full p-4 pl-12 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none bg-gray-50 font-bold tracking-wider"
                    />
                  </div>
                  <button
                    onClick={() => handleApply(couponCode)}
                    disabled={applying || !couponCode}
                    className="bg-blue-600 text-white px-6 rounded-2xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {applying ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  Promoções Disponíveis
                </h4>

                <div className="space-y-4">
                  {activePromos.map((promo) => (
                    <div 
                      key={promo.id}
                      className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                      onClick={() => handleApply(promo.code)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            promo.type === 'percent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {promo.type === 'percent' ? <Percent className="w-6 h-6" /> : <Tag className="w-6 h-6" />}
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900">{promo.title}</h5>
                            <p className="text-xs text-gray-500">{promo.description}</p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-blue-600">{promo.discount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Código:</span>
                          <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{promo.code}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                          Aplicar
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Ticket cutouts */}
                      <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 bg-white border border-gray-100 rounded-full" />
                      <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-white border border-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <Ticket className="w-6 h-6 text-blue-600" />
                  <h4 className="font-bold text-blue-900">Como funcionam os cupons?</h4>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Os cupons de desconto são aplicados automaticamente ao valor final da sua corrida. 
                  Apenas um cupom pode ser usado por viagem. O desconto não se aplica a taxas de cancelamento.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
