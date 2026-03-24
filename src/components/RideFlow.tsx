import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Modal, Alert, ActivityIndicator, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
  Clock,
  ArrowUp,
  ArrowUpRight
} from 'lucide-react';
import { rideService } from '../services/rideService';

const RideOption = ({ type, title, description, price, discountedPrice, icon, selected, onClick, coupon, onDetails }: any) => (
  <TouchableOpacity
    onPress={onClick}
    style={[styles.rideOption, selected && styles.rideOptionSelected]}
  >
    <View style={styles.rideOptionLeft}>
      <View style={styles.rideOptionIconContainer}>
        <Image source={{ uri: icon }} style={styles.rideOptionIcon} />
      </View>
      <View>
        <Text style={styles.rideOptionTitle}>{title}</Text>
        <Text style={styles.rideOptionDescription}>{description}</Text>
      </View>
    </View>
    <View style={styles.rideOptionRight}>
      <Text style={[styles.rideOptionPrice, coupon && styles.rideOptionPriceDiscounted]}>
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)}
      </Text>
      {coupon && (
        <Text style={styles.rideOptionDiscountedPrice}>
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(discountedPrice)}
        </Text>
      )}
      {onDetails && (
        <TouchableOpacity onPress={onDetails} style={styles.detailsButton}>
          <Info size={14} color="#2563eb" />
          <Text style={styles.detailsButtonText}>Detalhes</Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  rideEstimateContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 32,
  },
  surgeWarning: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  surgeIconContainer: {
    backgroundColor: '#ffedd5',
    padding: 10,
    borderRadius: 20,
  },
  surgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f97316',
  },
  surgeDescription: {
    fontSize: 12,
    color: '#f97316',
    opacity: 0.8,
    fontWeight: '500',
  },
  couponSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  couponActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 16,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  couponDescription: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  couponStatus: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  applyButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.3,
  },
  applyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingIconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  loadingCarIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
  },
  loadingDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 18,
  },
  rideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  rideOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
  },
  rideOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rideOptionIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rideOptionIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  rideOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  rideOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  rideOptionRight: {
    alignItems: 'flex-end',
  },
  rideOptionPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  rideOptionPriceDiscounted: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  rideOptionDiscountedPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  sosButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  callButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sosModalCancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  sosModalCancelButtonText: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 16,
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#fee2e2',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  breakdownList: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  breakdownRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563eb',
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f3f4f6',
  },
  paymentOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  paymentOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  paymentOptionTextSelected: {
    color: '#2563eb',
  },
  calculatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  spinner: {
    marginBottom: 24,
  },
  calculatingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 24,
  },
  cancelCalculatingButton: {
    padding: 12,
  },
  cancelCalculatingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  rideStatusContainer: {
    padding: 20,
  },
  rideStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rideStatusTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  rideStatusSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  rideStatusSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  sosButtonHeader: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 24,
  },
  driverInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  driverImageContainer: {
    position: 'relative',
  },
  driverImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  driverRatingBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  driverRatingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  driverVehicle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 4,
  },
  driverPlateContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  driverPlate: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 2,
  },
  driverActions: {
    flexDirection: 'column',
    gap: 12,
  },
  driverActionButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chatBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#dc2626',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  rideActionsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  shareRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  shareRideButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  cancelRideButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelRideButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  completedContainer: {
    alignItems: 'center',
    padding: 24,
  },
  completedIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#dcfce7',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  completedDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  completedPrice: {
    fontSize: 48,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 40,
  },
  ratingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  starButton: {
    padding: 4,
  },
  tipContainer: {
    width: '100%',
    marginBottom: 40,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  tipGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  tipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  tipButtonSelected: {
    backgroundColor: '#2563eb',
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  tipButtonTextSelected: {
    color: '#fff',
  },
  submitRatingButton: {
    width: '100%',
    backgroundColor: '#111827',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitRatingButtonDisabled: {
    opacity: 0.3,
  },
  submitRatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    marginTop: 16,
    gap: 16,
  },
  pixIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#dbeafe',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixTextContainer: {
    flex: 1,
  },
  pixTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  pixDescription: {
    fontSize: 14,
    color: '#3b82f6',
  },
});

interface RideFlowProps {
  rideStatus: any;
  currentRideId: string | null; // Adicionado
  destination: any;
  setDestination: (dest: any) => void;
  setRideStatus: any;
  setRoute: (route: any) => void;
  setRideEstimate: (estimate: any) => void;
  rideEstimate: any;
  selectedRideType: any;
  setSelectedRideType: any;
  paymentMethod: any;
  setPaymentMethod: any;
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
  coupon?: any;
  setCoupon?: any;
}

const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impactAsync(style);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = await rideService.validateCoupon(couponCode);
      setCoupon(data);
      Alert.alert("Sucesso", `Cupom aplicado: ${data.description}`);
      setCouponCode('');
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao validar cupom");
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Share functionality would need to be implemented using expo-sharing
    Alert.alert("Compartilhar", "Funcionalidade de compartilhamento a ser implementada.");
  };
  return (
    <>
      {rideStatus === "selecting" && destination && (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRideStatus("idle");
                setDestination(null);
                setRoute(null);
                setRideEstimate(null);
              }}
              style={styles.backButton}
            >
              <ArrowLeft size={28} color="#2563eb" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Selecione uma corrida</Text>
          </View>

          {rideEstimate ? (
            <Animated.View style={styles.rideEstimateContainer}>
              {rideEstimate.surgeMultiplier && rideEstimate.surgeMultiplier > 1.1 && (
                <View style={styles.surgeWarning}>
                  <View style={styles.surgeIconContainer}>
                    <TrendingUp size={24} color="#f97316" />
                  </View>
                  <View>
                    <Text style={styles.surgeTitle}>Tarifa Dinâmica Ativa</Text>
                    <Text style={styles.surgeDescription}>Preços mais altos devido à alta demanda.</Text>
                  </View>
                </View>
              )}

              <RideOption
                type="padrao"
                title="Padrão"
                description={`Chegada em ${rideEstimate.duration} min`}
                price={rideEstimate.pricePadrao}
                discountedPrice={calculateDiscountedPrice(rideEstimate.pricePadrao)}
                icon="https://mobile-content.uber.com/launch-experience/ride.png"
                selected={selectedRideType === "padrao"}
                onClick={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRideType("padrao");
                }}
                coupon={coupon}
                onDetails={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFareBreakdown(true);
                }}
              />

              <RideOption
                type="comfort"
                title="Comfort"
                description="Carros novos e espaçosos"
                price={rideEstimate.priceComfort}
                discountedPrice={calculateDiscountedPrice(rideEstimate.priceComfort)}
                icon="https://mobile-content.uber.com/launch-experience/comfort.png"
                selected={selectedRideType === "comfort"}
                onClick={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRideType("comfort");
                }}
                coupon={coupon}
              />

              <RideOption
                type="moto"
                title="Moto"
                description="Economize tempo no trânsito"
                price={rideEstimate.pricePadrao * 0.6}
                discountedPrice={calculateDiscountedPrice(rideEstimate.pricePadrao * 0.6)}
                icon="https://mobile-content.uber.com/launch-experience/uber_moto.png"
                selected={selectedRideType === "moto"}
                onClick={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRideType("moto");
                }}
                coupon={coupon}
              />

              {/* Payment Method Selector */}
              <div className="mt-4">
                <h3 className="font-bold text-[var(--system-secondary-label)] mb-4 text-xs uppercase tracking-widest px-1">
                  Forma de Pagamento
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setPaymentMethod("pix");
                    }}
                    style={[styles.paymentOption, paymentMethod === "pix" && styles.paymentOptionSelected]}
                  >
                    <QrCode size={28} color={paymentMethod === "pix" ? "#2563eb" : "#6b7280"} />
                    <Text style={[styles.paymentOptionText, paymentMethod === "pix" && styles.paymentOptionTextSelected]}>Pix</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setPaymentMethod("dinheiro");
                    }}
                    style={[styles.paymentOption, paymentMethod === "dinheiro" && styles.paymentOptionSelected]}
                  >
                    <Banknote size={28} color={paymentMethod === "dinheiro" ? "#2563eb" : "#6b7280"} />
                    <Text style={[styles.paymentOptionText, paymentMethod === "dinheiro" && styles.paymentOptionTextSelected]}>Dinheiro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setPaymentMethod("cartao");
                    }}
                    style={[styles.paymentOption, paymentMethod === "cartao" && styles.paymentOptionSelected]}
                  >
                    <CreditCard size={28} color={paymentMethod === "cartao" ? "#2563eb" : "#6b7280"} />
                    <Text style={[styles.paymentOptionText, paymentMethod === "cartao" && styles.paymentOptionTextSelected]}>Cartão</Text>
                  </TouchableOpacity>
                </div>
              </div>

              {/* PIX Mock Info */}
              {paymentMethod === 'pix' && (
                <View style={styles.pixContainer}>
                  <View style={styles.pixIconContainer}>
                    <QrCode size={32} color="#2563eb" />
                  </View>
                  <View style={styles.pixTextContainer}>
                    <Text style={styles.pixTitle}>Pagamento via PIX</Text>
                    <Text style={styles.pixDescription}>Pague após a corrida ser aceita pelo motorista.</Text>
                  </View>
                </View>
              )}

              {/* Coupon Section */}
              <View style={styles.couponSection}>
                <Text style={styles.sectionTitle}>Cupom de Desconto</Text>
                {coupon ? (
                  <View style={styles.couponActive}>
                    <View style={styles.couponLeft}>
                      <Tag size={24} color="#2563eb" />
                      <View>
                        <Text style={styles.couponDescription}>{coupon.description}</Text>
                        <Text style={styles.couponStatus}>CUPOM ATIVO</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCoupon(null);
                      }}
                    >
                      <Text style={styles.removeCouponText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.couponInputContainer}>
                    <View style={styles.inputWrapper}>
                      <Ticket size={20} color="#9ca3af" />
                      <TextInput 
                        value={couponCode}
                        onChangeText={(text) => setCouponCode(text.toUpperCase())}
                        placeholder="CÓDIGO DO CUPOM"
                        style={styles.couponInput}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                      style={[styles.applyButton, (isValidatingCoupon || !couponCode.trim()) && styles.applyButtonDisabled]}
                    >
                      <Text style={styles.applyButtonText}>
                        {isValidatingCoupon ? '...' : 'Aplicar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          ) : (
            <View style={styles.calculatingContainer}>
              <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} />
              <Text style={styles.calculatingText}>Calculando melhor rota...</Text>
              <TouchableOpacity 
                onPress={() => {
                  triggerHaptic();
                  setRideStatus("idle");
                  setDestination(null);
                  setRoute(null);
                  setRideEstimate(null);
                }}
                style={styles.cancelCalculatingButton}
              >
                <Text style={styles.cancelCalculatingButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleRequestRide();
            }}
            disabled={!rideEstimate}
            style={[styles.confirmButton, !rideEstimate && styles.confirmButtonDisabled]}
          >
            <Text style={styles.confirmButtonText}>
              Confirmar {selectedRideType === "padrao" ? "Padrão" : "Comfort"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {rideStatus === "requesting" && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color="#111827" />
            <View style={styles.loadingCarIcon}>
              <Car size={40} color="#111827" />
            </View>
          </View>
          <Text style={styles.loadingTitle}>Procurando motorista...</Text>
          <Text style={styles.loadingDescription}>
            Aguardando um motorista aceitar sua solicitação. Isso pode levar alguns instantes.
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenCancelRide();
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancelar Solicitação</Text>
          </TouchableOpacity>
        </View>
      )}

      {["accepted", "arrived", "in_progress"].includes(rideStatus) && (
        <View style={styles.rideStatusContainer}>
          <View style={styles.rideStatusHeader}>
            <View>
              <Text style={styles.rideStatusTitle}>
                {rideStatus === "accepted" && "Motorista a caminho"}
                {rideStatus === "arrived" && "O motorista chegou!"}
                {rideStatus === "in_progress" && "Em viagem"}
              </Text>
              <View style={styles.rideStatusSubheader}>
                <Clock size={16} color="#2563eb" />
                <Text style={styles.rideStatusSubtitle}>
                  {rideStatus === "accepted" && "Aguarde no local"}
                  {rideStatus === "arrived" && "Encontre o veículo"}
                  {rideStatus === "in_progress" && "Aproveite o trajeto"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                setIsSOSModalOpen(true);
              }}
              style={styles.sosButtonHeader}
            >
              <AlertTriangle size={28} color="#dc2626" />
            </TouchableOpacity>
          </View>

          <View style={styles.driverInfoContainer}>
            <View style={styles.driverImageContainer}>
              <Image
                source={{ uri: completedRideData?.driverPhoto || "https://i.pravatar.cc/150?img=11" }}
                style={styles.driverImage}
              />
              <View style={styles.driverRatingBadge}>
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.driverRatingText}>{completedRideData?.driverRating ? Number(completedRideData.driverRating).toFixed(1) : "5.0"}</Text>
              </View>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{completedRideData?.driverName || "Motorista"}</Text>
              <Text style={styles.driverVehicle}>{completedRideData?.driverVehicle?.color} {completedRideData?.driverVehicle?.model}</Text>
              <View style={styles.driverPlateContainer}>
                <Text style={styles.driverPlate}>{completedRideData?.driverVehicle?.plate || "ABC-1234"}</Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity 
                onPress={() => triggerHaptic()}
                style={styles.driverActionButton}
              >
                <Phone size={24} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic();
                  setIsChatOpen(true);
                }}
                style={styles.driverActionButton}
              >
                <MessageSquare size={24} color="#2563eb" />
                {chatMessages.length > 0 &&
                  chatMessages[chatMessages.length - 1].senderId !== user?.uid && (
                    <View style={styles.chatBadge} />
                  )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rideActionsContainer}>
            <TouchableOpacity
              onPress={handleShareRide}
              style={styles.shareRideButton}
            >
              <Navigation size={20} color="#2563eb" />
              <Text style={styles.shareRideButtonText}>Compartilhar Viagem</Text>
            </TouchableOpacity>

            {rideStatus !== "in_progress" && (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic();
                  onOpenCancelRide();
                }}
                style={styles.cancelRideButton}
              >
                <Text style={styles.cancelRideButtonText}>Cancelar Corrida</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {rideStatus === "completed" && completedRideData && (
        <View style={styles.completedContainer}>
          <View style={styles.completedIconContainer}>
            <Check size={40} color="#16a34a" />
          </View>
          <Text style={styles.completedTitle}>Viagem concluída!</Text>
          <Text style={styles.completedDescription}>Você chegou ao seu destino com segurança.</Text>

          <Text style={styles.completedPrice}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(completedRideData.price || 0)}
          </Text>

          <Text style={styles.ratingTitle}>Como foi sua experiência?</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  triggerHaptic();
                  setRating(star);
                }}
                style={styles.starButton}
              >
                <Star
                  size={48}
                  color={rating >= star ? "#f59e0b" : "#d1d5db"}
                  fill={rating >= star ? "#f59e0b" : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>Adicionar gorjeta?</Text>
              <View style={styles.tipGrid}>
                {[0, 2, 5, 10].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => {
                      triggerHaptic();
                      setTip(amount);
                    }}
                    style={[styles.tipButton, tip === amount && styles.tipButtonSelected]}
                  >
                    <Text style={[styles.tipButtonText, tip === amount && styles.tipButtonTextSelected]}>
                      {amount === 0 ? "Não" : `R$ ${amount}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              handleSubmitRating();
            }}
            disabled={rating === 0}
            style={[styles.submitRatingButton, rating === 0 && styles.submitRatingButtonDisabled]}
          >
            <Text style={styles.submitRatingButtonText}>Avaliar e Concluir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fare Breakdown Modal */}
      {showFareBreakdown && (
          <Modal
            transparent={true}
            visible={showFareBreakdown}
            animationType="slide"
            onRequestClose={() => setShowFareBreakdown(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity 
                style={StyleSheet.absoluteFill}
                onPress={() => setShowFareBreakdown(false)}
              />
              <View style={styles.modalContent}>
                <View style={styles.handle} />
                <View style={styles.headerRow}>
                  <Text style={styles.modalTitle}>Detalhes do Preço</Text>
                  <TouchableOpacity onPress={() => setShowFareBreakdown(false)}>
                    <X size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.breakdownList}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Tarifa Base</Text>
                    <Text style={styles.breakdownValue}>R$ 5,00</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Distância</Text>
                    <Text style={styles.breakdownValue}>R$ {rideEstimate?.distance?.toFixed(1)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Tempo</Text>
                    <Text style={styles.breakdownValue}>R$ {rideEstimate?.duration}</Text>
                  </View>
                  <View style={styles.breakdownRowTotal}>
                    <Text style={styles.totalLabel}>Total Estimado</Text>
                    <Text style={styles.totalValue}>R$ {rideEstimate?.pricePadrao}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => setShowFareBreakdown(false)}
                  style={styles.sosButton}
                >
                  <Text style={styles.sosButtonText}>Entendi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

      {/* SOS Modal */}
      {isSOSModalOpen && (
          <Modal
            transparent={true}
            visible={isSOSModalOpen}
            animationType="slide"
            onRequestClose={() => setIsSOSModalOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity 
                style={StyleSheet.absoluteFill}
                onPress={() => setIsSOSModalOpen(false)}
              />
              <View style={styles.modalContent}>
                <View style={styles.handle} />
                <View style={styles.iconContainer}>
                  <AlertTriangle size={40} color="#dc2626" />
                </View>
                
                <Text style={styles.modalTitle}>S.O.S Emergência</Text>
                <Text style={styles.modalDescription}>
                  Deseja enviar um alerta de emergência para nossa central e contatos de segurança?
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                      setIsSOSModalOpen(false);
                      Alert.alert("Erro", "ALERTA DE EMERGÊNCIA ENVIADO!");
                    }}
                    style={styles.sosButton}
                  >
                    <Text style={styles.sosButtonText}>ENVIAR ALERTA AGORA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                      Linking.openURL('tel:190');
                    }}
                    style={styles.callButton}
                  >
                    <Text style={styles.callButtonText}>Ligar para 190</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setIsSOSModalOpen(false)}
                    style={styles.sosModalCancelButton}
                  >
                    <Text style={styles.sosModalCancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
    </>
  );
};
