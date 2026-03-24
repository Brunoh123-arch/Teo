import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Receipt, MapPin, Calendar, CreditCard, User, Download, Printer } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  ride,
}) => {
  if (!ride) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] border-t border-white/50"
          >
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[var(--system-blue)]" />
                  <h3 className="font-bold text-lg text-[var(--system-label)]">Recibo da Viagem</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Info */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-[var(--system-blue)] rounded-3xl flex items-center justify-center mx-auto mb-2">
                  <Receipt size={32} />
                </div>
                <h2 className="text-3xl font-semibold text-[var(--system-label)]">
                  {formatCurrency(ride.price)}
                </h2>
                <p className="text-sm text-[var(--system-secondary-label)]">Obrigado por viajar conosco!</p>
              </div>

              {/* Details Grid */}
              <div className="space-y-4 bg-[var(--system-background)] p-4 rounded-3xl border border-gray-100">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[var(--system-secondary-label)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--system-secondary-label)] uppercase font-semibold">Data e Hora</p>
                    <p className="text-sm font-semibold text-[var(--system-label)]">{formatDate(ride.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--system-green)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--system-secondary-label)] uppercase font-semibold">Origem</p>
                    <p className="text-sm font-semibold text-[var(--system-label)] line-clamp-1">{ride.originName || 'Local de partida'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--system-red)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--system-secondary-label)] uppercase font-semibold">Destino</p>
                    <p className="text-sm font-semibold text-[var(--system-label)] line-clamp-1">{ride.destName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-[var(--system-secondary-label)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--system-secondary-label)] uppercase font-semibold">Pagamento</p>
                    <p className="text-sm font-semibold text-[var(--system-label)] uppercase">{ride.paymentMethod || 'PIX'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[var(--system-secondary-label)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--system-secondary-label)] uppercase font-semibold">Motorista</p>
                    <p className="text-sm font-semibold text-[var(--system-label)]">{ride.driverName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--system-label)] px-1">Detalhamento</h4>
                <div className="border border-gray-100 rounded-3xl overflow-hidden bg-[var(--system-secondary-background)]">
                  <div className="flex justify-between p-4 border-b border-gray-100">
                    <span className="text-sm text-[var(--system-secondary-label)]">Tarifa Base</span>
                    <span className="text-sm font-semibold text-[var(--system-label)]">{formatCurrency(ride.price * 0.8)}</span>
                  </div>
                  <div className="flex justify-between p-4 border-b border-gray-100">
                    <span className="text-sm text-[var(--system-secondary-label)]">Taxas e Impostos</span>
                    <span className="text-sm font-semibold text-[var(--system-label)]">{formatCurrency(ride.price * 0.2)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-50">
                    <span className="text-sm font-semibold text-[var(--system-label)]">Total</span>
                    <span className="text-sm font-semibold text-[var(--system-label)]">{formatCurrency(ride.price)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white/50 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-gray-100 text-[var(--system-label)] font-semibold py-4 rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-[var(--system-blue)] text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
