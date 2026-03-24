import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Receipt } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { ReceiptModal } from './ReceiptModal';

interface Ride {
  id: string;
  originName?: string;
  destName: string;
  price: number;
  status: string;
  createdAt: any;
  paymentMethod?: string;
  driverName?: string;
  driverPhoto?: string;
  riderName?: string;
  rating?: number;
}

interface RideHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  rides: Ride[];
  onRateRide: (rideId: string, driverName?: string, driverPhoto?: string) => void;
}

export const RideHistoryModal: React.FC<RideHistoryModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  rides,
  onRateRide,
}) => {
  const [selectedRideForReceipt, setSelectedRideForReceipt] = useState<Ride | null>(null);

  return (
    <>
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
                  <h3 className="font-bold text-lg text-[var(--system-label)]">Suas Viagens</h3>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[var(--system-background)]">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : rides.length === 0 ? (
                  <div className="text-center py-8 text-[var(--system-secondary-label)]">
                    Nenhuma viagem encontrada.
                  </div>
                ) : (
                  rides.map((ride) => (
                    <div
                      key={ride.id}
                      className="bg-[var(--system-secondary-background)] p-5 rounded-3xl border border-gray-100 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-[10px] text-[var(--system-secondary-label)] uppercase font-semibold">Origem</p>
                          <h4 className="font-semibold text-[var(--system-label)] line-clamp-1">{ride.originName || 'Não informado'}</h4>
                          <p className="text-[10px] text-[var(--system-secondary-label)] uppercase mt-2 font-semibold">Destino</p>
                          <h4 className="font-semibold text-[var(--system-label)] line-clamp-1">{ride.destName}</h4>
                        </div>
                        <span className="font-semibold text-[var(--system-blue)] ml-2">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(ride.price || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-[var(--system-secondary-label)] mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-[var(--system-label)]">
                            {ride.driverName ? `Motorista: ${ride.driverName}` : `Passageiro: ${ride.riderName || 'Desconhecido'}`}
                          </span>
                          <span className="text-[11px]">
                            {ride.createdAt?.toDate
                              ? ride.createdAt
                                  .toDate()
                                  .toLocaleDateString("pt-BR")
                              : ""}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold ${ride.status === "completed" ? "bg-[var(--system-green)]/10 text-[var(--system-green)]" : "bg-[var(--system-red)]/10 text-[var(--system-red)]"}`}
                          >
                            {ride.status === "completed" ? "Concluída" : "Cancelada"}
                          </span>
                          {ride.status === "completed" && (
                            <div className="flex gap-3">
                              {ride.rating ? (
                                <span className="text-[11px] font-semibold text-yellow-600">★ {ride.rating}</span>
                              ) : (
                                <button
                                  onClick={() => onRateRide(ride.id, ride.driverName, ride.driverPhoto)}
                                  className="text-[11px] text-[var(--system-blue)] font-semibold hover:underline"
                                >
                                  Avaliar
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedRideForReceipt(ride)}
                                className="text-[11px] text-[var(--system-secondary-label)] font-semibold hover:underline flex items-center gap-1"
                              >
                                <Receipt size={12} />
                                Recibo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {ride.paymentMethod && (
                        <p className="text-[10px] text-[var(--system-secondary-label)] mt-3 uppercase font-semibold">
                          Pagamento: {ride.paymentMethod}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReceiptModal
        isOpen={!!selectedRideForReceipt}
        onClose={() => setSelectedRideForReceipt(null)}
        ride={selectedRideForReceipt}
      />
    </>
  );
};
