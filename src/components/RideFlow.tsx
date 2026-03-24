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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                triggerHaptic();
                setRideStatus("idle");
                setDestination(null);
                setRoute(null);
                setRideEstimate(null);
              }}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">Selecione uma corrida</h2>
          </div>

          {rideEstimate ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 mb-6"
            >
              {rideEstimate.surgeMultiplier && rideEstimate.surgeMultiplier > 1.1 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-2 flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-800">Tarifa Dinâmica Ativa</p>
                    <p className="text-xs text-orange-700">Preços mais altos devido à alta demanda.</p>
                  </div>
                </div>
              )}

              {/* Ride Option 1 */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic();
                  setSelectedRideType("padrao");
                }}
                className={`flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-200 border-2 ${selectedRideType === "padrao" ? "border-[var(--system-blue)] bg-white shadow-md" : "border-transparent bg-[var(--system-secondary-background)] hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src="https://mobile-content.uber.com/launch-experience/ride.png" alt="UberX" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--system-label)] text-lg">Padrão</h3>
                      <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Popular</span>
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
                      className="text-[10px] text-[var(--system-blue)] font-bold flex items-center gap-1 mt-1 hover:underline"
                    >
                      <Info className="w-3 h-3" /> Detalhes
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Ride Option 2 */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic();
                  setSelectedRideType("comfort");
                }}
                className={`flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-200 border-2 ${selectedRideType === "comfort" ? "border-[var(--system-blue)] bg-white shadow-md" : "border-transparent bg-[var(--system-secondary-background)] hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src="https://mobile-content.uber.com/launch-experience/comfort.png" alt="Comfort" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--system-label)] text-lg">Comfort</h3>
                      <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Melhor</span>
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic();
                  setSelectedRideType("moto");
                }}
                className={`flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-200 border-2 ${selectedRideType === "moto" ? "border-[var(--system-blue)] bg-white shadow-md" : "border-transparent bg-[var(--system-secondary-background)] hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src="https://mobile-content.uber.com/launch-experience/uber_moto.png" alt="Moto" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--system-label)] text-lg">Moto</h3>
                      <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Rápido</span>
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
              <div className="mt-2">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                  Forma de Pagamento
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPaymentMethod("pix");
                    }}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${paymentMethod === "pix" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <QrCode className="w-6 h-6" />
                    <span className="text-sm font-bold">Pix</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPaymentMethod("dinheiro");
                    }}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${paymentMethod === "dinheiro" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="text-sm font-bold">Dinheiro</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPaymentMethod("cartao");
                    }}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${paymentMethod === "cartao" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm font-bold">Cartão</span>
                  </button>
                </div>
              </div>

              {/* PIX Mock Info */}
              {paymentMethod === 'pix' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3"
                >
                  <div className="bg-white p-2 rounded-lg border border-blue-200">
                    <QrCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-900">Pagamento via PIX</p>
                    <p className="text-[10px] text-blue-700">Pague após a corrida ser aceita pelo motorista.</p>
                  </div>
                </motion.div>
              )}

              {/* Coupon Section */}
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                  Cupom de Desconto
                </h3>
                {coupon ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">{coupon.description}</p>
                        <p className="text-[10px] text-blue-600 uppercase font-bold">Cupom Ativo</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { triggerHaptic(); setCoupon(null); }}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Código do cupom"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none text-sm uppercase font-bold"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                      className="bg-gray-900 text-white px-6 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      {isValidatingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 text-sm mb-4">Calculando melhor rota...</p>
              <button 
                onClick={() => {
                  triggerHaptic();
                  setRideStatus("idle");
                  setDestination(null);
                  setRoute(null);
                  setRideEstimate(null);
                }}
                className="text-blue-600 text-sm font-bold hover:underline"
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
            className="w-full bg-[var(--system-blue)] text-white font-semibold text-lg py-4 rounded-3xl hover:opacity-90 transition-opacity disabled:bg-gray-300"
          >
            Confirmar {selectedRideType === "padrao" ? "Padrão" : "Comfort"}
          </button>
        </div>
      )}

      {rideStatus === "requesting" && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Procurando seu motorista...</h2>
          <p className="text-gray-500 text-center mb-6">
            Seu pedido está no banco de dados. Aguardando um motorista aceitar.
          </p>
          <button
            onClick={() => {
              triggerHaptic();
              onOpenCancelRide();
            }}
            className="w-full bg-gray-200 text-gray-900 font-bold text-lg py-4 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancelar Pedido
          </button>
        </div>
      )}

      {["accepted", "arrived", "in_progress"].includes(rideStatus) && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {rideStatus === "accepted" && "O motorista está a caminho"}
                {rideStatus === "arrived" && "O motorista chegou!"}
                {rideStatus === "in_progress" && "Em viagem para o destino"}
              </h2>
              {rideStatus === "accepted" && (
                <p className="text-gray-500">Aguarde no local de embarque</p>
              )}
              {rideStatus === "arrived" && (
                <p className="text-green-600 font-medium">Encontre o motorista</p>
              )}
              {rideStatus === "in_progress" && (
                <p className="text-blue-600 font-medium">Aproveite a viagem</p>
              )}
            </div>
            {/* Botão de Emergência */}
            <button
              onClick={() => {
                triggerHaptic(ImpactStyle.Heavy);
                setIsSOSModalOpen(true);
              }}
              className="bg-red-100 text-red-600 p-3 rounded-full hover:bg-red-200 transition-colors"
              title="Emergência"
            >
              <AlertTriangle className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
            <div className="relative">
              <img
                src={completedRideData?.driverPhoto || "https://i.pravatar.cc/150?img=11"}
                alt="Driver"
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold">{completedRideData?.driverRating ? Number(completedRideData.driverRating).toFixed(1) : "5.0"}</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">
                {completedRideData?.driverName || "Motorista"}
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                {completedRideData?.driverVehicle?.color} {completedRideData?.driverVehicle?.model} • {completedRideData?.driverVehicle?.year}
              </p>
              <p className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 inline-block mt-1">
                {completedRideData?.driverVehicle?.plate || "ABC-1234"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => triggerHaptic()}
                className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 border border-gray-100"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setIsChatOpen(true);
                }}
                className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 border border-gray-100 relative"
              >
                <MessageSquare className="w-5 h-5" />
                {chatMessages.length > 0 &&
                  chatMessages[chatMessages.length - 1].senderId !== user?.uid && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
              </button>
              <button
                onClick={handleShareRide}
                className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 border border-gray-100"
                title="Compartilhar Viagem"
              >
                <span className="font-bold text-xs">Compartilhar</span>
              </button>
            </div>
          </div>

          {rideStatus !== "in_progress" && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  const lat = completedRideData?.origin?.lat || 0;
                  const lng = completedRideData?.origin?.lng || 0;
                  window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_system');
                }}
                className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Waze
              </button>
              <button
                onClick={() => {
                  const lat = completedRideData?.origin?.lat || 0;
                  const lng = completedRideData?.origin?.lng || 0;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_system');
                }}
                className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-green-100 hover:bg-green-100 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Google Maps
              </button>
            </div>
          )}

          {rideStatus !== "in_progress" && (
            <button
              onClick={() => {
                triggerHaptic();
                onOpenCancelRide();
              }}
              className="w-full bg-gray-200 text-gray-900 font-bold text-lg py-4 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Cancelar Corrida
            </button>
          )}
        </div>
      )}

      {rideStatus === "completed" && completedRideData && (
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Corrida Concluída!</h2>
          <p className="text-gray-500 mb-6">Você chegou ao seu destino.</p>

          <div className="text-4xl font-bold text-gray-900 mb-8">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(completedRideData.price || 0)}
          </div>

          <h3 className="font-semibold text-gray-700 mb-4">Como foi a viagem?</h3>
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  triggerHaptic();
                  setRating(star);
                }}
                className="p-2 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="w-full mb-8">
              <h3 className="font-semibold text-gray-700 mb-3">Adicionar uma gorjeta?</h3>
              <div className="flex gap-2 justify-center">
                {[0, 2, 5, 10].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      triggerHaptic();
                      setTip(amount);
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                      tip === amount
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {amount === 0 ? "Agora não" : `R$ ${amount}`}
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
            className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
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
