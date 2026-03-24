import React, { useEffect, useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Banknote, 
  Star,
  Navigation,
  ShieldAlert,
  Wallet,
  TrendingUp,
  BatteryWarning
} from 'lucide-react';
import { DriverEarningsModal } from './DriverEarningsModal';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

interface DriverUIProps {
  isOnline: boolean;
  toggleOnlineStatus: () => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  activeDriverRide: any;
  setIsChatOpen: (isOpen: boolean) => void;
  chatMessages: any[];
  user: any;
  handleUpdateRideStatus: (rideId: string, status: string) => void;
  handleCompleteRide: (rideId: string) => void;
  handleDriverCancel: (rideId: string) => void;
  dailyEarnings: number;
  availableRides: any[];
  handleAcceptRide: (rideId: string) => void;
  handleShareRide: (rideId: string) => void;
  onOpenWallet: () => void;
  driverStatus?: "none" | "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  driverData?: any;
  onOpenVerification?: () => void;
}

export const DriverUI: React.FC<DriverUIProps> = ({
  isOnline,
  toggleOnlineStatus,
  showHeatmap,
  setShowHeatmap,
  activeDriverRide,
  setIsChatOpen,
  chatMessages,
  user,
  handleUpdateRideStatus,
  handleCompleteRide,
  handleDriverCancel,
  dailyEarnings,
  availableRides,
  handleAcceptRide,
  handleShareRide,
  onOpenWallet,
  driverStatus = "approved", // Default to approved for backward compatibility if not passed
  rejectionReason,
  driverData,
  onOpenVerification,
}) => {
  const [isEarningsModalOpen, setIsEarningsModalOpen] = React.useState(false);
  const [batteryInfo, setBatteryInfo] = React.useState<{ batteryLevel: number; isCharging: boolean } | null>(null);
  const [driverStats, setDriverStats] = React.useState({
    totalRides: 42,
    rating: 4.9,
    onlineHours: 5.5,
    acceptanceRate: 98
  });

  React.useEffect(() => {
    const checkBattery = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getBatteryInfo();
          setBatteryInfo({
            batteryLevel: info.batteryLevel || 0,
            isCharging: info.isCharging || false
          });
        } catch (e) {
          console.warn('Battery info not available', e);
        }
      }
    };
    checkBattery();
    const interval = setInterval(checkBattery, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);


  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
    }
  };

  React.useEffect(() => {
    console.log("DriverUI: Props updated", {
      isOnline,
      availableRidesCount: availableRides.length,
      hasActiveRide: !!activeDriverRide
    });
  }, [isOnline, availableRides, activeDriverRide]);

  if (driverStatus !== "approved") {
    return (
      <div className="flex flex-col gap-4 p-4 bg-white rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Cadastro de Motorista</h2>
        
        {driverStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
            <h3 className="font-bold text-yellow-800 mb-1">Em Análise</h3>
            <p className="text-sm text-yellow-700">
              Seus documentos estão sendo analisados pela nossa equipe. Você será notificado assim que for aprovado.
            </p>
          </div>
        )}

        {driverStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <h3 className="font-bold text-red-800 mb-1">Cadastro Recusado</h3>
            <p className="text-sm text-red-700 mb-2">
              Infelizmente seu cadastro não foi aprovado. Por favor, verifique os dados e tente novamente.
            </p>
            {rejectionReason && (
              <div className="bg-white/50 p-3 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-red-900">Motivo:</p>
                <p className="text-sm text-red-800">{rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {/* driverStatus === "none" || driverStatus === "rejected" */}
        {(driverStatus === "none" || driverStatus === "rejected") && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Para começar a receber corridas, você precisa completar o seu cadastro enviando os documentos necessários.
            </p>
            <button
              onClick={() => {
                triggerHaptic(ImpactStyle.Medium);
                if (onOpenVerification) onOpenVerification();
              }}
              className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors mt-2"
            >
              Completar Cadastro
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DriverEarningsModal 
        isOpen={isEarningsModalOpen} 
        onClose={() => setIsEarningsModalOpen(false)} 
      />
      
      {/* Debug Info (Only for testing) */}
      <div className="text-[10px] text-gray-400 font-mono bg-gray-50 p-2 rounded border border-gray-100 mb-2">
        DEBUG: Online={isOnline ? "SIM" : "NÃO"} | Rides={availableRides.length} | User={user?.uid?.substring(0, 5)}
      </div>

      {batteryInfo && (batteryInfo.batteryLevel < 0.2 || !batteryInfo.isCharging) && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-center gap-3 mb-4">
          <BatteryWarning className="w-6 h-6 text-orange-600" />
          <div>
            <p className="text-sm font-bold text-orange-900">
              Bateria: {(batteryInfo.batteryLevel * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-orange-700">
              {batteryInfo.isCharging ? 'Carregando' : 'Conecte ao carregador'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-2xl font-bold text-[var(--system-label)] tracking-tight">Modo Motorista</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              triggerHaptic(ImpactStyle.Medium);
              setShowHeatmap(!showHeatmap);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${showHeatmap ? 'bg-[var(--system-red)] text-white shadow-sm' : 'bg-[var(--system-secondary-background)] text-[var(--system-label)] border border-[var(--system-separator)]'}`}
          >
            {showHeatmap ? 'Ocultar Calor' : 'Mapa de Calor'}
          </button>
          <button
            onClick={() => {
              triggerHaptic(ImpactStyle.Medium);
              toggleOnlineStatus();
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-sm ${
              isOnline
                ? "bg-[var(--system-green)] text-white"
                : "bg-[var(--system-secondary-background)] text-[var(--system-secondary-label)] border border-[var(--system-separator)]"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-[var(--system-secondary-label)]"
              }`}
            ></div>
            {isOnline ? "Online" : "Offline"}
          </button>
        </div>
      </div>

      {/* Driver Dashboard Stats */}
      {!activeDriverRide && isOnline && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[var(--system-secondary-background)] p-4 rounded-2xl border border-[var(--system-separator)] shadow-sm">
            <div className="flex items-center gap-2 text-[var(--system-secondary-label)] text-[10px] font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-3 h-3 text-[var(--system-blue)]" />
              Ganhos Hoje
            </div>
            <div className="text-xl font-bold text-[var(--system-label)]">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dailyEarnings)}
            </div>
          </div>
          <div className="bg-[var(--system-secondary-background)] p-4 rounded-2xl border border-[var(--system-separator)] shadow-sm">
            <div className="flex items-center gap-2 text-[var(--system-secondary-label)] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Star className="w-3 h-3 text-[var(--system-orange)]" />
              Avaliação
            </div>
            <div className="text-xl font-bold text-[var(--system-label)]">{driverStats.rating}</div>
          </div>
          <div className="bg-[var(--system-secondary-background)] p-4 rounded-2xl border border-[var(--system-separator)] shadow-sm">
            <div className="flex items-center gap-2 text-[var(--system-secondary-label)] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Navigation className="w-3 h-3 text-[var(--system-green)]" />
              Corridas
            </div>
            <div className="text-xl font-bold text-[var(--system-label)]">{driverStats.totalRides}</div>
          </div>
          <div className="bg-[var(--system-secondary-background)] p-4 rounded-2xl border border-[var(--system-separator)] shadow-sm">
            <div className="flex items-center gap-2 text-[var(--system-secondary-label)] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Wallet className="w-3 h-3 text-[var(--system-blue)]" />
              Aceitação
            </div>
            <div className="text-xl font-bold text-[var(--system-label)]">{driverStats.acceptanceRate}%</div>
          </div>
        </div>
      )}

      {activeDriverRide ? (
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <h3 className="font-bold text-blue-900 mb-1">Corrida em Andamento</h3>
            <p className="text-sm text-blue-700 mb-3">
              {activeDriverRide.status === "accepted" && "Vá até o passageiro"}
              {activeDriverRide.status === "arrived" && "Aguardando o passageiro"}
              {activeDriverRide.status === "in_progress" && "Levando ao destino"}
            </p>

            {/* Botão de Emergência */}
            <button
              onClick={() => {
                triggerHaptic(ImpactStyle.Heavy);
                window.location.href = 'tel:190';
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-2 rounded-xl mb-4 hover:bg-red-700 transition-colors"
            >
              <ShieldAlert className="w-5 h-5" />
              Emergência
            </button>

            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="https://i.pravatar.cc/150?img=32"
                  alt="Passenger"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">Passageiro</h4>
                  <p className="text-sm text-gray-500">Destino: {activeDriverRide.destName}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-blue-600">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setIsChatOpen(true);
                    }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-blue-600 relative"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {chatMessages.length > 0 &&
                      chatMessages[chatMessages.length - 1].senderId !== user?.uid && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                      )}
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      handleShareRide(activeDriverRide.id);
                    }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-blue-600"
                    title="Compartilhar Viagem"
                  >
                    <span className="font-bold text-xs">Compartilhar</span>
                  </button>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    const lat = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lat : activeDriverRide.destination.lat;
                    const lng = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lng : activeDriverRide.destination.lng;
                    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_system');
                  }}
                  className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Waze
                </button>
                <button
                  onClick={() => {
                    const lat = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lat : activeDriverRide.destination.lat;
                    const lng = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lng : activeDriverRide.destination.lng;
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_system');
                  }}
                  className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-green-100 hover:bg-green-100 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Google Maps
                </button>
              </div>

              {activeDriverRide.status === "accepted" && (
                <button
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    handleUpdateRideStatus(activeDriverRide.id, "arrived");
                  }}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md text-lg"
                >
                  Cheguei ao Local
                </button>
              )}

              {activeDriverRide.status === "arrived" && (
                <button
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    handleUpdateRideStatus(activeDriverRide.id, "in_progress");
                  }}
                  className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors shadow-md text-lg"
                >
                  Iniciar Corrida
                </button>
              )}

              {activeDriverRide.status === "in_progress" && (
                <button
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    handleCompleteRide(activeDriverRide.id);
                  }}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md text-lg"
                >
                  Finalizar Corrida
                </button>
              )}

              <button
                onClick={() => {
                  triggerHaptic(ImpactStyle.Medium);
                  handleDriverCancel(activeDriverRide.id);
                }}
                className="w-full mt-4 text-red-600 font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                Cancelar Corrida
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Painel de Ganhos */}
          <div className="bg-[var(--system-green)] rounded-2xl p-4 shadow-sm mb-2 flex items-center justify-between cursor-pointer active:opacity-70 transition-all" onClick={() => {
            triggerHaptic();
            setIsEarningsModalOpen(true);
          }}>
            <div>
              <p className="text-xs text-white/80 font-bold uppercase tracking-wider">Ganhos de Hoje</p>
              <p className="text-2xl font-bold text-white">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(dailyEarnings)}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
              <Banknote className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              onClick={() => {
                triggerHaptic();
                onOpenWallet();
              }}
              className="bg-[var(--system-secondary-background)] p-4 rounded-2xl border border-[var(--system-separator)] shadow-sm flex items-center gap-3 active:bg-[var(--system-quaternary-background)] transition-colors"
            >
              <div className="bg-[var(--system-blue)]/10 p-2 rounded-xl">
                <Wallet className="w-5 h-5 text-[var(--system-blue)]" />
              </div>
              <span className="font-bold text-[var(--system-label)] text-sm">Sacar Saldo</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic();
                setIsEarningsModalOpen(true);
              }}
              className="bg-[var(--system-secondary-background)] p-4 rounded-2xl border border-[var(--system-separator)] shadow-sm flex items-center gap-3 active:bg-[var(--system-quaternary-background)] transition-colors"
            >
              <div className="bg-purple-500/10 p-2 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <span className="font-bold text-[var(--system-label)] text-sm">Ver Ganhos</span>
            </button>
          </div>

          {/* Painel do Veículo */}
          {driverData?.vehicle && (
            <div className="bg-[var(--system-secondary-background)] rounded-2xl p-4 border border-[var(--system-separator)] mb-2">
              <p className="text-[10px] text-[var(--system-secondary-label)] uppercase font-bold tracking-wider mb-2">Seu Veículo</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--system-label)]">{driverData.vehicle.color} {driverData.vehicle.model}</p>
                  <p className="text-sm text-[var(--system-secondary-label)]">{driverData.vehicle.year} • {driverData.vehicle.plate}</p>
                </div>
                <div className="bg-[var(--system-background)] p-2 rounded-xl border border-[var(--system-separator)] shadow-sm">
                  <Star className="w-5 h-5 text-[var(--system-orange)] fill-[var(--system-orange)]" />
                </div>
              </div>
            </div>
          )}

          <h2 className="text-sm font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-2 px-1">
            Pedidos Disponíveis ({availableRides.length})
          </h2>
          {!isOnline ? (
            <div className="text-center py-10 bg-[var(--system-secondary-background)] rounded-2xl border border-dashed border-[var(--system-separator)]">
              <p className="text-[var(--system-label)] font-bold">Você está offline</p>
              <p className="text-xs text-[var(--system-secondary-label)] mt-1">Fique online para receber pedidos</p>
              <button
                onClick={() => {
                  triggerHaptic(ImpactStyle.Medium);
                  toggleOnlineStatus();
                }}
                className="mt-5 bg-[var(--system-blue)] text-white px-8 py-3 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform"
              >
                Ficar Online
              </button>
            </div>
          ) : availableRides.length > 0 ? (
            availableRides.map((ride) => (
              <div
                key={ride.id}
                className="bg-[var(--system-secondary-background)] border border-[var(--system-separator)] p-4 rounded-2xl flex flex-col gap-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-[10px] text-[var(--system-secondary-label)] uppercase font-bold tracking-wider mb-1">Destino</p>
                    <p className="font-bold text-[var(--system-label)] text-lg leading-tight">{ride.destName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-[var(--system-blue)]/10 text-[var(--system-blue)] text-xs font-bold px-2 py-1 rounded-md">
                        {ride.distance?.toFixed(1)} km
                      </span>
                      <span className="bg-[var(--system-green)]/10 text-[var(--system-green)] text-xs font-bold px-2 py-1 rounded-md uppercase">
                        {ride.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[var(--system-green)]">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(ride.price)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    handleAcceptRide(ride.id);
                  }}
                  className="w-full bg-[var(--system-label)] text-[var(--system-background)] font-bold py-4 rounded-xl active:scale-[0.98] transition-all shadow-md"
                >
                  Aceitar Corrida
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-[var(--system-secondary-background)] rounded-2xl border border-[var(--system-separator)]">
              <div className="w-10 h-10 border-4 border-[var(--system-separator)] border-t-[var(--system-blue)] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--system-secondary-label)] font-medium">Procurando pedidos...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
