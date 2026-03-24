import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MessageSquare, Send, ThumbsUp, ShieldCheck } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { rideService } from '../services/rideService';

interface RateRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  onRated: () => void;
  driverName?: string;
  driverPhoto?: string;
}

export const RateRideModal = ({ isOpen, onClose, rideId, onRated, driverName = "Motorista", driverPhoto }: RateRideModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota.");
      return;
    }
    setSubmitting(true);
    triggerHaptic(ImpactStyle.Medium);
    try {
      await rideService.rateRide(rideId, rating, comment);
      toast.success("Obrigado pela sua avaliação!");
      onRated();
      onClose();
    } catch (error) {
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setSubmitting(false);
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
                <h3 className="font-bold text-lg text-[var(--system-label)]">Avaliar Viagem</h3>
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

            <div className="flex-1 overflow-y-auto p-6 text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                  {driverPhoto ? (
                    <img src={driverPhoto} alt={driverName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                      {driverName.charAt(0)}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1">{driverName}</h2>
                <p className="text-gray-500 text-sm">Como foi sua viagem?</p>
              </div>

              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      triggerHaptic();
                      setRating(star);
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-2 transition-transform active:scale-125"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        (hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe um comentário opcional..."
                    rows={4}
                    className="w-full p-4 pl-12 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none resize-none bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => {
                    triggerHaptic();
                    setComment(prev => prev + " Excelente motorista! ");
                  }}
                  className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 hover:bg-gray-100"
                >
                  <ThumbsUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  Excelente
                </button>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setComment(prev => prev + " Carro muito limpo. ");
                  }}
                  className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 hover:bg-gray-100"
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  Carro Limpo
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
