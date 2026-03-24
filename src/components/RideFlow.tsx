import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { 
  ArrowLeft, 
  Car, 
  CarFront, 
  QrCode, 
  Banknote, 
  CreditCard, 
  Star, 
  Phone, 
  MessageSquare, 
  Check,
  Ticket,
  Tag,
  TrendingUp,
  AlertTriangle,
  Info,
  X,
  ChevronRight,
  Navigation,
  MapPin,
  Clock
} from 'lucide-react';
import { rideService } from '../services/rideService';

// --- Sub-componentes ---

const RideOption = ({ type, title, description, price, discountedPrice, icon, selected, onClick, coupon }: any) => (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role="button"
      aria-label={`Selecionar opção de corrida ${title}`}
      aria-pressed={selected}
      className={`flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-200 border-2 ${selected ? "border-[var(--system-blue)] bg-white shadow-md" : "border-transparent bg-[var(--system-secondary-background)] hover:bg-gray-50"}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
          <img src={icon} alt={title} className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--system-label)] text-lg">{title}</h3>
          </div>
          <p className="text-sm text-[var(--system-secondary-label)] font-medium">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold text-[var(--system-label)] text-xl ${coupon ? 'line-through text-sm text-[var(--system-secondary-label)]' : ''}`}>
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)}
        </p>
        {coupon && (
          <p className="font-semibold text-[var(--system-blue)] text-xl">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(discountedPrice)}
          </p>
        )}
      </div>
    </motion.div>
);

interface RideFlowProps {
  rideStatus: string;
  currentRideId: string | null; // Adicionado
  destination: any;
  setDestination: (dest: any) => void;
  setRideStatus: (status: string) => void;
  setRoute: (route: any) => void;
  setRideEstimate: (estimate: any) => void;
  rideEstimate: any;
  selectedRideType: string;
  setSelectedRideType: (type: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  handleRequestRide: () => void;
  onOpenCancelRide: () => void;
  completedRideData: any;
  setIsChatOpen: (isOpen: boolean) => void;
  chatMessages: any[];
  user: any;
  rating: number;
  setRating: (rating: number) => void;
  tip: number;
  setTip: (tip: number) => void;
  handleSubmitRating: () => void;
}

const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style });
  }
};

export const RideFlow: React.FC<RideFlowProps> = ({
  rideStatus,
  currentRideId, // Adicionado
  destination,
  setDestination,
  setRideStatus,
  setRoute,
  setRideEstimate,
  rideEstimate,
  selectedRideType,
  setSelectedRideType,
  paymentMethod,
  setPaymentMethod,
  handleRequestRide,
  onOpenCancelRide,
  completedRideData,
  setIsChatOpen,
  chatMessages,
  user,
  rating,
  setRating,
  tip,
  setTip,
  handleSubmitRating,
  coupon,
  setCoupon,
}) => {
  const [couponCode, setCouponCode] = React.useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);
  const [showFareBreakdown, setShowFareBreakdown] = React.useState(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = React.useState(false);


  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    triggerHaptic(ImpactStyle.Medium);
    try {
      const data = await rideService.validateCoupon(couponCode);
      setCoupon(data);
      toast.success(`Cupom aplicado: ${data.description}`);
      setCouponCode('');
    } catch (error: any) {
      toast.error(error.message || "Erro ao validar cupom");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const calculateDiscountedPrice = (price: number) => {
    if (!coupon) return price;
    if (coupon.discountType === 'percentage') {
      return price * (1 - coupon.discountValue / 100);
    }
    return Math.max(0, price - coupon.discountValue);
  };
  const handleShareRide = async () => {
    triggerHaptic();
    const shareUrl = `${window.location.origin}/share-ride/${currentRideId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Acompanhe minha viagem',
          url: shareUrl,
        });
        toast.success("Viagem compartilhada!");
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link de compartilhamento copiado!");
    }
  };
  return (
    <>
      {rideStatus === "selecting" && destination && (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                triggerHaptic();
                setRideStatus("idle");
                setDestination(null);
                setRoute(null);
                setRideEstimate(null);
              }}
              className="p-2 -ml-2 active:opacity-50 transition-opacity"
            >
              <ArrowLeft className="w-7 h-7 text-[var(--system-blue)]" />
            </button>
            <h2 className="text-2xl font-bold text-[var(--system-label)]">Selecione uma corrida</h2>
          </div>

          {rideEstimate ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 mb-8"
            >
              {rideEstimate.surgeMultiplier && rideEstimate.surgeMultiplier > 1.1 && (
                <div className="bg-[var(--system-orange)]/10 border border-[var(--system-orange)]/20 rounded-2xl p-4 mb-2 flex items-center gap-4">
                  <div className="bg-[var(--system-orange)]/20 p-2.5 rounded-full">
                    <TrendingUp className="w-6 h-6 text-[var(--system-orange)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--system-orange)]">Tarifa Dinâmica Ativa</p>
                    <p className="text-xs text-[var(--system-orange)]/80 font-medium">Preços mais altos devido à alta demanda.</p>
                  </div>
                </div>
              )}

              {/* Ride Option 1 */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic();
                  setSelectedRideType("padrao");
                }}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${selectedRideType === "padrao" ? "border-[var(--system-blue)] bg-[var(--system-secondary-background)] shadow-lg" : "border-transparent bg-[var(--system-secondary-background)] active:bg-[var(--system-tertiary-background)]"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[var(--system-background)] rounded-xl flex items-center justify-center overflow-hidden p-1">
                    <img src="https://mobile-content.uber.com/launch-experience/ride.png" alt="UberX" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--system-label)] text-lg">Padrão</h3>
                      <span className="bg-[var(--system-gray5)] text-[var(--system-gray)] text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase">Popular</span>
                    </div>
                    <p className="text-sm text-[var(--system-secondary-label)] font-medium">
                      Chegada em {rideEstimate.duration} min
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <p className={`font-black text-[var(--system-label)] text-xl ${coupon ? 'line-through text-sm text-[var(--system-secondary-label)]' : ''}`}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(rideEstimate.pricePadrao)}
                    </p>
                    {coupon && (
                      <p className="font-black text-[var(--system-blue)] text-xl">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(calculateDiscountedPrice(rideEstimate.pricePadrao))}
                      </p>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerHaptic(); setShowFareBreakdown(true); }}
                      className="text-[11px] text-[var(--system-blue)] font-bold flex items-center gap-1 mt-1 active:opacity-50"
                    >
                      <Info className="w-3.5 h-3.5" /> Detalhes
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Ride Option 2 */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic();
                  setSelectedRideType("comfort");
                }}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${selectedRideType === "comfort" ? "border-[var(--system-blue)] bg-[var(--system-secondary-background)] shadow-lg" : "border-transparent bg-[var(--system-secondary-background)] active:bg-[var(--system-tertiary-background)]"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[var(--system-background)] rounded-xl flex items-center justify-center overflow-hidden p-1">
                    <img src="https://mobile-content.uber.com/launch-experience/comfort.png" alt="Comfort" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--system-label)] text-lg">Comfort</h3>
                      <span className="bg-[var(--system-blue)]/10 text-[var(--system-blue)] text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase">Melhor</span>
                    </div>
                    <p className="text-sm text-[var(--system-secondary-label)] font-medium">
                      Carros novos e espaçosos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-[var(--system-label)] text-xl ${coupon ? 'line-through text-sm text-[var(--system-secondary-label)]' : ''}`}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(rideEstimate.priceComfort)}
                  </p>
                  {coupon && (
                    <p className="font-black text-[var(--system-blue)] text-xl">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(calculateDiscountedPrice(rideEstimate.priceComfort))}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Ride Option 3: Moto */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic();
                  setSelectedRideType("moto");
                }}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${selectedRideType === "moto" ? "border-[var(--system-blue)] bg-[var(--system-secondary-background)] shadow-lg" : "border-transparent bg-[var(--system-secondary-background)] active:bg-[var(--system-tertiary-background)]"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[var(--system-background)] rounded-xl flex items-center justify-center overflow-hidden p-1">
                    <img src="https://mobile-content.uber.com/launch-experience/uber_moto.png" alt="Moto" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--system-label)] text-lg">Moto</h3>
                      <span className="bg-[var(--system-green)]/10 text-[var(--system-green)] text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase">Rápido</span>
                    </div>
                    <p className="text-sm text-[var(--system-secondary-label)] font-medium">
                      Economize tempo no trânsito
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-[var(--system-label)] text-xl ${coupon ? 'line-through text-sm text-[var(--system-secondary-label)]' : ''}`}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(rideEstimate.pricePadrao * 0.6)}
                  </p>
                  {coupon && (
                    <p className="font-black text-[var(--system-blue)] text-xl">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(calculateDiscountedPrice(rideEstimate.pricePadrao * 0.6))}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Payment Method Selector */}
              <div className="mt-4">
                <h3 className="font-bold text-[var(--system-secondary-label)] mb-4 text-xs uppercase tracking-widest px-1">
                  Forma de Pagamento
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPaymentMethod("pix");
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === "pix" ? "border-[var(--system-blue)] bg-[var(--system-blue)]/5 text-[var(--system-blue)]" : "border-transparent bg-[var(--system-secondary-background)] text-[var(--system-secondary-label)] active:bg-[var(--system-tertiary-background)]"}`}
                  >
                    <QrCode className="w-7 h-7" />
                    <span className="text-xs font-bold">Pix</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPaymentMethod("dinheiro");
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === "dinheiro" ? "border-[var(--system-blue)] bg-[var(--system-blue)]/5 text-[var(--system-blue)]" : "border-transparent bg-[var(--system-secondary-background)] text-[var(--system-secondary-label)] active:bg-[var(--system-tertiary-background)]"}`}
                  >
                    <Banknote className="w-7 h-7" />
                    <span className="text-xs font-bold">Dinheiro</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPaymentMethod("cartao");
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === "cartao" ? "border-[var(--system-blue)] bg-[var(--system-blue)]/5 text-[var(--system-blue)]" : "border-transparent bg-[var(--system-secondary-background)] text-[var(--system-secondary-label)] active:bg-[var(--system-tertiary-background)]"}`}
                  >
                    <CreditCard className="w-7 h-7" />
                    <span className="text-xs font-bold">Cartão</span>
                  </button>
                </div>
              </div>

              {/* PIX Mock Info */}
              {paymentMethod === 'pix' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-[var(--system-blue)]/5 border border-[var(--system-blue)]/10 rounded-2xl flex items-center gap-4"
                >
                  <div className="bg-[var(--system-secondary-background)] p-2.5 rounded-xl border border-[var(--system-blue)]/20">
                    <QrCode className="w-8 h-8 text-[var(--system-blue)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--system-label)]">Pagamento via PIX</p>
                    <p className="text-xs text-[var(--system-secondary-label)] font-medium">Pague após a corrida ser aceita pelo motorista.</p>
                  </div>
                </motion.div>
              )}

              {/* Coupon Section */}
              <div className="mt-6">
                <h3 className="font-bold text-[var(--system-secondary-label)] mb-4 text-xs uppercase tracking-widest px-1">
                  Cupom de Desconto
                </h3>
                {coupon ? (
                  <div className="flex items-center justify-between p-4 bg-[var(--system-blue)]/5 border border-[var(--system-blue)]/10 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <Tag className="w-6 h-6 text-[var(--system-blue)]" />
                      <div>
                        <p className="text-sm font-bold text-[var(--system-label)]">{coupon.description}</p>
                        <p className="text-[10px] text-[var(--system-blue)] uppercase font-black tracking-wider">Cupom Ativo</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { triggerHaptic(); setCoupon(null); }}
                      className="text-xs font-bold text-[var(--system-red)] active:opacity-50 transition-opacity"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--system-tertiary-label)]" />
                      <input 
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO DO CUPOM"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--system-secondary-background)] border border-[var(--system-separator)]/30 focus:border-[var(--system-blue)] outline-none text-sm uppercase font-bold text-[var(--system-label)] placeholder:text-[var(--system-tertiary-label)]"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                      className="bg-[var(--system-label)] text-[var(--system-background)] px-6 rounded-2xl font-bold text-sm active:opacity-80 disabled:opacity-30 transition-all"
                    >
                      {isValidatingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-[var(--system-separator)]/20 border-t-[var(--system-blue)] rounded-full animate-spin mb-6"></div>
              <p className="text-[var(--system-secondary-label)] text-lg font-medium mb-6">Calculando melhor rota...</p>
              <button 
                onClick={() => {
                  triggerHaptic();
                  setRideStatus("idle");
                  setDestination(null);
                  setRoute(null);
                  setRideEstimate(null);
                }}
                className="text-[var(--system-blue)] text-lg font-bold active:opacity-50 transition-opacity"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <button
            onClick={() => {
              triggerHaptic(ImpactStyle.Heavy);
              handleRequestRide();
            }}
            disabled={!rideEstimate}
            className="w-full bg-[var(--system-blue)] text-white font-bold text-xl py-5 rounded-3xl active:opacity-80 transition-all disabled:bg-[var(--system-gray4)] shadow-lg shadow-[var(--system-blue)]/20 mb-2"
          >
            Confirmar {selectedRideType === "padrao" ? "Padrão" : "Comfort"}
          </button>
        </div>
      )}

      {rideStatus === "requesting" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-4 border-[var(--system-separator)]/20 border-t-[var(--system-label)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="w-10 h-10 text-[var(--system-label)]" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-[var(--system-label)] mb-3">Procurando motorista...</h2>
          <p className="text-[var(--system-secondary-label)] text-center mb-10 font-medium px-4">
            Aguardando um motorista aceitar sua solicitação. Isso pode levar alguns instantes.
          </p>
          <button
            onClick={() => {
              triggerHaptic();
              onOpenCancelRide();
            }}
            className="w-full bg-[var(--system-tertiary-background)] text-[var(--system-label)] font-bold text-lg py-5 rounded-3xl active:opacity-70 transition-all"
          >
            Cancelar Solicitação
          </button>
        </div>
      )}

      {["accepted", "arrived", "in_progress"].includes(rideStatus) && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-[var(--system-label)] leading-tight">
                {rideStatus === "accepted" && "Motorista a caminho"}
                {rideStatus === "arrived" && "O motorista chegou!"}
                {rideStatus === "in_progress" && "Em viagem"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-[var(--system-blue)]" />
                <p className="text-[var(--system-secondary-label)] font-bold text-sm uppercase tracking-wider">
                  {rideStatus === "accepted" && "Aguarde no local"}
                  {rideStatus === "arrived" && "Encontre o veículo"}
                  {rideStatus === "in_progress" && "Aproveite o trajeto"}
                </p>
              </div>
            </div>
            {/* Botão de Emergência */}
            <button
              onClick={() => {
                triggerHaptic(ImpactStyle.Heavy);
                setIsSOSModalOpen(true);
              }}
              className="bg-[var(--system-red)]/10 text-[var(--system-red)] p-4 rounded-full active:bg-[var(--system-red)]/20 transition-colors shadow-sm"
              title="Emergência"
            >
              <AlertTriangle className="w-7 h-7" />
            </button>
          </div>

          <div className="flex items-center gap-5 p-5 bg-[var(--system-secondary-background)] rounded-3xl mb-8 border border-[var(--system-separator)]/20 shadow-sm">
            <div className="relative">
              <img
                src={completedRideData?.driverPhoto || "https://i.pravatar.cc/150?img=11"}
                alt="Driver"
                className="w-20 h-20 rounded-full object-cover border-4 border-[var(--system-background)] shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-[var(--system-secondary-background)] rounded-full px-2 py-1 shadow-md flex items-center gap-1 border border-[var(--system-separator)]/20">
                <Star className="w-3.5 h-3.5 text-[var(--system-yellow)] fill-[var(--system-yellow)]" />
                <span className="text-xs font-black text-[var(--system-label)]">{completedRideData?.driverRating ? Number(completedRideData.driverRating).toFixed(1) : "5.0"}</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-[var(--system-label)] text-xl leading-tight">
                {completedRideData?.driverName || "Motorista"}
              </h3>
              <p className="text-sm text-[var(--system-secondary-label)] font-bold mt-1">
                {completedRideData?.driverVehicle?.color} {completedRideData?.driverVehicle?.model}
              </p>
              <div className="mt-2 inline-block bg-[var(--system-background)] px-3 py-1 rounded-lg border border-[var(--system-separator)]/30">
                <span className="text-sm font-black text-[var(--system-label)] tracking-widest">
                  {completedRideData?.driverVehicle?.plate || "ABC-1234"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => triggerHaptic()}
                className="w-12 h-12 bg-[var(--system-background)] rounded-full shadow-sm flex items-center justify-center text-[var(--system-blue)] border border-[var(--system-separator)]/20 active:opacity-60"
              >
                <Phone className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setIsChatOpen(true);
                }}
                className="w-12 h-12 bg-[var(--system-background)] rounded-full shadow-sm flex items-center justify-center text-[var(--system-blue)] border border-[var(--system-separator)]/20 active:opacity-60 relative"
              >
                <MessageSquare className="w-6 h-6" />
                {chatMessages.length > 0 &&
                  chatMessages[chatMessages.length - 1].senderId !== user?.uid && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--system-red)] rounded-full border-2 border-[var(--system-secondary-background)]"></span>
                  )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleShareRide}
              className="w-full bg-[var(--system-secondary-background)] text-[var(--system-blue)] font-bold text-lg py-4 rounded-2xl border border-[var(--system-blue)]/20 active:bg-[var(--system-blue)]/5 transition-all flex items-center justify-center gap-3"
            >
              <Navigation className="w-5 h-5" />
              Compartilhar Viagem
            </button>

            {rideStatus !== "in_progress" && (
              <button
                onClick={() => {
                  triggerHaptic();
                  onOpenCancelRide();
                }}
                className="w-full text-[var(--system-red)] font-bold text-lg py-4 rounded-2xl active:bg-[var(--system-red)]/5 transition-all"
              >
                Cancelar Corrida
              </button>
            )}
          </div>
        </div>
      )}

      {rideStatus === "completed" && completedRideData && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-20 h-20 bg-[var(--system-green)]/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Check className="w-10 h-10 text-[var(--system-green)]" />
          </div>
          <h2 className="text-3xl font-black text-[var(--system-label)] mb-2">Viagem concluída!</h2>
          <p className="text-[var(--system-secondary-label)] mb-8 font-medium">Você chegou ao seu destino com segurança.</p>

          <div className="text-5xl font-black text-[var(--system-label)] mb-10 tracking-tight">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(completedRideData.price || 0)}
          </div>

          <h3 className="font-bold text-[var(--system-secondary-label)] mb-6 text-xs uppercase tracking-widest">Como foi sua experiência?</h3>
          <div className="flex gap-3 mb-10">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  triggerHaptic();
                  setRating(star);
                }}
                className="p-1 transition-transform active:scale-90"
              >
                <Star
                  className={`w-12 h-12 ${rating >= star ? "text-[var(--system-yellow)] fill-[var(--system-yellow)]" : "text-[var(--system-tertiary-label)]"}`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="w-full mb-10">
              <h3 className="font-bold text-[var(--system-secondary-label)] mb-4 text-xs uppercase tracking-widest">Adicionar gorjeta?</h3>
              <div className="grid grid-cols-4 gap-2">
                {[0, 2, 5, 10].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      triggerHaptic();
                      setTip(amount);
                    }}
                    className={`py-4 rounded-2xl font-black text-sm transition-all ${
                      tip === amount
                        ? "bg-[var(--system-blue)] text-white shadow-lg shadow-[var(--system-blue)]/20"
                        : "bg-[var(--system-secondary-background)] text-[var(--system-label)] border border-[var(--system-separator)]/20 active:bg-[var(--system-tertiary-background)]"
                    }`}
                  >
                    {amount === 0 ? "Não" : `R$ ${amount}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              triggerHaptic(ImpactStyle.Medium);
              handleSubmitRating();
            }}
            disabled={rating === 0}
            className="w-full bg-[var(--system-label)] text-[var(--system-background)] font-black text-xl py-5 rounded-3xl active:opacity-80 transition-all disabled:opacity-30 shadow-xl"
          >
            Avaliar e Concluir
          </button>
        </div>
      )}

      {/* Fare Breakdown Modal */}
      <AnimatePresence>
        {showFareBreakdown && (
          <div className="fixed inset-0 z-[3000] flex flex-col justify-end pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowFareBreakdown(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl rounded-t-3xl w-full p-6 shadow-2xl border-t border-white/50 relative z-10 flex flex-col items-center"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-6" />
              <div className="flex justify-between items-center w-full mb-6">
                <h3 className="text-xl font-bold text-[var(--system-label)]">Detalhes do Preço</h3>
                <button onClick={() => setShowFareBreakdown(false)} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>

              <div className="space-y-4 w-full">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--system-secondary-label)] font-medium">Tarifa Base</span>
                  <span className="font-bold text-[var(--system-label)]">R$ 5,00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--system-secondary-label)] font-medium">Distância ({rideEstimate?.distance?.toFixed(1)} km)</span>
                  <span className="font-bold text-[var(--system-label)]">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rideEstimate?.distance * 1.5)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--system-secondary-label)] font-medium">Tempo ({rideEstimate?.duration} min)</span>
                  <span className="font-bold text-[var(--system-label)]">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rideEstimate?.duration * 0.3)}
                  </span>
                </div>
                {rideEstimate?.surgeMultiplier > 1 && (
                  <div className="flex justify-between text-sm text-[var(--system-orange)] font-bold">
                    <span>Tarifa Dinâmica (x{rideEstimate.surgeMultiplier.toFixed(1)})</span>
                    <span>+ {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((rideEstimate.pricePadrao / rideEstimate.surgeMultiplier) * (rideEstimate.surgeMultiplier - 1))}</span>
                  </div>
                )}
                <div className="h-px bg-gray-100 my-2" />
                <div className="flex justify-between text-lg font-black">
                  <span className="text-[var(--system-label)]">Total Estimado</span>
                  <span className="text-[var(--system-blue)]">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rideEstimate?.pricePadrao)}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setShowFareBreakdown(false)}
                className="w-full mt-8 bg-[var(--system-label)] text-[var(--system-background)] font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-opacity pb-[env(safe-area-inset-bottom,16px)]"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <AnimatePresence>
        {isSOSModalOpen && (
          <div className="fixed inset-0 z-[3000] flex flex-col justify-end pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSOSModalOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl rounded-t-3xl w-full p-6 shadow-2xl border-t border-white/50 relative z-10 flex flex-col items-center"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-6" />
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-black text-[var(--system-label)] mb-2">S.O.S Emergência</h3>
              <p className="text-[var(--system-secondary-label)] text-center mb-8 font-medium">
                Deseja enviar um alerta de emergência para nossa central e contatos de segurança?
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    setIsSOSModalOpen(false);
                    toast.error("ALERTA DE EMERGÊNCIA ENVIADO!", { duration: 5000 });
                  }}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
                >
                  ENVIAR ALERTA AGORA
                </button>
                <button 
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    window.location.href = 'tel:190';
                  }}
                  className="w-full bg-white border border-gray-200 text-[var(--system-label)] font-bold py-4 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Ligar para 190
                </button>
                <button 
                  onClick={() => setIsSOSModalOpen(false)}
                  className="w-full bg-gray-100 text-[var(--system-secondary-label)] font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors pb-[env(safe-area-inset-bottom,16px)]"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
