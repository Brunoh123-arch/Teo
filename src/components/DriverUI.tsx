import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Linking,
  ScrollView
} from 'react-native';
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
} from 'lucide-react-native';
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
  driverStatus = "approved",
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
      <View style={styles.container}>
        <Text style={styles.title}>Cadastro de Motorista</Text>
        
        {driverStatus === "pending" && (
          <View style={styles.statusBoxPending}>
            <Text style={styles.statusTitlePending}>Em Análise</Text>
            <Text style={styles.statusTextPending}>
              Seus documentos estão sendo analisados pela nossa equipe. Você será notificado assim que for aprovado.
            </Text>
          </View>
        )}

        {driverStatus === "rejected" && (
          <View style={styles.statusBoxRejected}>
            <Text style={styles.statusTitleRejected}>Cadastro Recusado</Text>
            <Text style={styles.statusTextRejected}>
              Infelizmente seu cadastro não foi aprovado. Por favor, verifique os dados e tente novamente.
            </Text>
            {rejectionReason && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Motivo:</Text>
                <Text style={styles.reasonText}>{rejectionReason}</Text>
              </View>
            )}
          </View>
        )}

        {(driverStatus === "none" || driverStatus === "rejected") && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionText}>
              Para começar a receber corridas, você precisa completar o seu cadastro enviando os documentos necessários.
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic(ImpactStyle.Medium);
                if (onOpenVerification) onOpenVerification();
              }}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Completar Cadastro</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <DriverEarningsModal 
        isOpen={isEarningsModalOpen} 
        onClose={() => setIsEarningsModalOpen(false)} 
      />
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          DEBUG: Online={isOnline ? "SIM" : "NÃO"} | Rides={availableRides.length} | User={user?.uid?.substring(0, 5)}
        </Text>
      </View>

      {batteryInfo && (batteryInfo.batteryLevel < 0.2 || !batteryInfo.isCharging) && (
        <View style={styles.batteryWarning}>
          <BatteryWarning size={24} color="#c2410c" />
          <View>
            <Text style={styles.batteryText}>
              Bateria: {(batteryInfo.batteryLevel * 100).toFixed(0)}%
            </Text>
            <Text style={styles.batterySubText}>
              {batteryInfo.isCharging ? 'Carregando' : 'Conecte ao carregador'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Modo Motorista</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic(ImpactStyle.Medium);
              setShowHeatmap(!showHeatmap);
            }}
            style={[styles.actionButtonSmall, showHeatmap ? styles.activeHeatmap : styles.inactiveHeatmap]}
          >
            <Text style={showHeatmap ? styles.activeHeatmapText : styles.inactiveHeatmapText}>
              {showHeatmap ? 'Ocultar Calor' : 'Mapa de Calor'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic(ImpactStyle.Medium);
              toggleOnlineStatus();
            }}
            style={[styles.onlineButton, isOnline ? styles.onlineButtonActive : styles.onlineButtonInactive]}
          >
            <View style={[styles.statusIndicator, isOnline ? styles.statusIndicatorActive : styles.statusIndicatorInactive]} />
            <Text style={isOnline ? styles.onlineButtonTextActive : styles.onlineButtonTextInactive}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!activeDriverRide && isOnline && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <TrendingUp size={12} color="#2563eb" />
              <Text style={styles.statLabel}>Ganhos Hoje</Text>
            </View>
            <Text style={styles.statValue}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dailyEarnings)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Star size={12} color="#f59e0b" />
              <Text style={styles.statLabel}>Avaliação</Text>
            </View>
            <Text style={styles.statValue}>{driverStats.rating}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Navigation size={12} color="#10b981" />
              <Text style={styles.statLabel}>Corridas</Text>
            </View>
            <Text style={styles.statValue}>{driverStats.totalRides}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Wallet size={12} color="#2563eb" />
              <Text style={styles.statLabel}>Aceitação</Text>
            </View>
            <Text style={styles.statValue}>{driverStats.acceptanceRate}%</Text>
          </View>
        </View>
      )}

      {activeDriverRide ? (
        <View style={styles.rideContainer}>
          <View style={styles.rideCard}>
            <Text style={styles.rideTitle}>Corrida em Andamento</Text>
            <Text style={styles.rideStatus}>
              {activeDriverRide.status === "accepted" && "Vá até o passageiro"}
              {activeDriverRide.status === "arrived" && "Aguardando o passageiro"}
              {activeDriverRide.status === "in_progress" && "Levando ao destino"}
            </Text>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic(ImpactStyle.Heavy);
                Linking.openURL('tel:190');
              }}
              style={styles.emergencyButton}
            >
              <ShieldAlert size={20} color="#ffffff" />
              <Text style={styles.emergencyButtonText}>Emergência</Text>
            </TouchableOpacity>

            <View style={styles.passengerCard}>
              <View style={styles.passengerInfo}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=32" }}
                  style={styles.passengerAvatar}
                />
                <View style={styles.passengerDetails}>
                  <Text style={styles.passengerName}>Passageiro</Text>
                  <Text style={styles.passengerDestination}>Destino: {activeDriverRide.destName}</Text>
                </View>
                <View style={styles.passengerActions}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Phone size={20} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setIsChatOpen(true);
                    }}
                    style={styles.iconButton}
                  >
                    <MessageSquare size={20} color="#2563eb" />
                    {chatMessages.length > 0 &&
                      chatMessages[chatMessages.length - 1].senderId !== user?.uid && (
                        <View style={styles.chatBadge} />
                      )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      handleShareRide(activeDriverRide.id);
                    }}
                    style={styles.iconButton}
                  >
                    <Text style={styles.shareText}>Compartilhar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.navButtons}>
                <TouchableOpacity
                  onPress={() => {
                    const lat = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lat : activeDriverRide.destination.lat;
                    const lng = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lng : activeDriverRide.destination.lng;
                    Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
                  }}
                  style={styles.navButtonWaze}
                >
                  <Navigation size={16} color="#1d4ed8" />
                  <Text style={styles.navButtonTextWaze}>Waze</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const lat = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lat : activeDriverRide.destination.lat;
                    const lng = activeDriverRide.status === 'accepted' ? activeDriverRide.origin.lng : activeDriverRide.destination.lng;
                    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                  }}
                  style={styles.navButtonMaps}
                >
                  <Navigation size={16} color="#15803d" />
                  <Text style={styles.navButtonTextMaps}>Google Maps</Text>
                </TouchableOpacity>
              </View>

              {activeDriverRide.status === "accepted" && (
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    handleUpdateRideStatus(activeDriverRide.id, "arrived");
                  }}
                  style={styles.actionButtonPrimary}
                >
                  <Text style={styles.actionButtonPrimaryText}>Cheguei ao Local</Text>
                </TouchableOpacity>
              )}

              {activeDriverRide.status === "arrived" && (
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    handleUpdateRideStatus(activeDriverRide.id, "in_progress");
                  }}
                  style={styles.actionButtonPrimary}
                >
                  <Text style={styles.actionButtonPrimaryText}>Iniciar Corrida</Text>
                </TouchableOpacity>
              )}

              {activeDriverRide.status === "in_progress" && (
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    handleCompleteRide(activeDriverRide.id);
                  }}
                  style={styles.actionButtonPrimary}
                >
                  <Text style={styles.actionButtonPrimaryText}>Finalizar Corrida</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic(ImpactStyle.Medium);
                  handleDriverCancel(activeDriverRide.id);
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar Corrida</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.dashboardContainer}>
          <TouchableOpacity style={styles.earningsPanel} onPress={() => {
            triggerHaptic();
            setIsEarningsModalOpen(true);
          }}>
            <View>
              <Text style={styles.earningsLabel}>Ganhos de Hoje</Text>
              <Text style={styles.earningsValue}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(dailyEarnings)}
              </Text>
            </View>
            <View style={styles.earningsIcon}>
              <Banknote size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.shortcutsGrid}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                onOpenWallet();
              }}
              style={styles.shortcutButton}
            >
              <View style={styles.shortcutIconWrapper}>
                <Wallet size={20} color="#2563eb" />
              </View>
              <Text style={styles.shortcutText}>Sacar Saldo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                setIsEarningsModalOpen(true);
              }}
              style={styles.shortcutButton}
            >
              <View style={styles.shortcutIconWrapperPurple}>
                <TrendingUp size={20} color="#a855f7" />
              </View>
              <Text style={styles.shortcutText}>Ver Ganhos</Text>
            </TouchableOpacity>
          </View>

          {driverData?.vehicle && (
            <View style={styles.vehiclePanel}>
              <Text style={styles.vehicleLabel}>Seu Veículo</Text>
              <View style={styles.vehicleInfo}>
                <View>
                  <Text style={styles.vehicleName}>{driverData.vehicle.color} {driverData.vehicle.model}</Text>
                  <Text style={styles.vehicleDetails}>{driverData.vehicle.year} • {driverData.vehicle.plate}</Text>
                </View>
                <View style={styles.vehicleRating}>
                  <Star size={20} color="#f59e0b" />
                </View>
              </View>
            </View>
          )}

          <Text style={styles.ridesTitle}>
            Pedidos Disponíveis ({availableRides.length})
          </Text>
          {!isOnline ? (
            <View style={styles.offlineContainer}>
              <Text style={styles.offlineText}>Você está offline</Text>
              <Text style={styles.offlineSubText}>Fique online para receber pedidos</Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic(ImpactStyle.Medium);
                  toggleOnlineStatus();
                }}
                style={styles.goOnlineButton}
              >
                <Text style={styles.goOnlineButtonText}>Ficar Online</Text>
              </TouchableOpacity>
            </View>
          ) : availableRides.length > 0 ? (
            availableRides.map((ride) => (
              <View
                key={ride.id}
                style={styles.rideItem}
              >
                <View style={styles.rideItemHeader}>
                  <View style={styles.rideItemInfo}>
                    <Text style={styles.rideItemLabel}>Destino</Text>
                    <Text style={styles.rideItemDestination}>{ride.destName}</Text>
                    <View style={styles.rideItemTags}>
                      <View style={styles.rideItemTagBlue}>
                        <Text style={styles.rideItemTagTextBlue}>{ride.distance?.toFixed(1)} km</Text>
                      </View>
                      <View style={styles.rideItemTagGreen}>
                        <Text style={styles.rideItemTagTextGreen}>{ride.paymentMethod}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.rideItemPriceContainer}>
                    <Text style={styles.rideItemPrice}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(ride.price)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic(ImpactStyle.Heavy);
                    handleAcceptRide(ride.id);
                  }}
                  style={styles.acceptRideButton}
                >
                  <Text style={styles.acceptRideButtonText}>Aceitar Corrida</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noRidesContainer}>
              <View style={styles.spinner} />
              <Text style={styles.noRidesText}>Procurando pedidos...</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statusBoxPending: { backgroundColor: '#fefce8', borderColor: '#fde68a', padding: 16, borderRadius: 12 },
  statusTitlePending: { fontWeight: 'bold', color: '#854d0e', marginBottom: 4 },
  statusTextPending: { fontSize: 14, color: '#a16207' },
  statusBoxRejected: { backgroundColor: '#fef2f2', borderColor: '#fecaca', padding: 16, borderRadius: 12 },
  statusTitleRejected: { fontWeight: 'bold', color: '#991b1b', marginBottom: 4 },
  statusTextRejected: { fontSize: 14, color: '#b91c1c', marginBottom: 8 },
  reasonBox: { backgroundColor: 'rgba(255,255,255,0.5)', padding: 12, borderRadius: 8, borderColor: '#fee2e2' },
  reasonLabel: { fontSize: 14, fontWeight: '500', color: '#991b1b' },
  reasonText: { fontSize: 14, color: '#991b1b' },
  actionContainer: { gap: 16 },
  actionText: { fontSize: 14, color: '#4b5563' },
  actionButton: { width: '100%', backgroundColor: '#000000', padding: 16, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#ffffff', fontWeight: 'bold' },
  debugContainer: { padding: 8, backgroundColor: '#f9fafb', borderRadius: 4, borderColor: '#f3f4f6', marginBottom: 8 },
  debugText: { fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' },
  batteryWarning: { backgroundColor: '#fff7ed', borderColor: '#fed7aa', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  batteryText: { fontSize: 14, fontWeight: 'bold', color: '#7c2d12' },
  batterySubText: { fontSize: 12, color: '#9a3412' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionButtonSmall: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  activeHeatmap: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  inactiveHeatmap: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
  activeHeatmapText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  inactiveHeatmapText: { color: '#111827', fontSize: 12, fontWeight: '600' },
  onlineButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineButtonActive: { backgroundColor: '#22c55e' },
  onlineButtonInactive: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  statusIndicatorActive: { backgroundColor: '#ffffff' },
  statusIndicatorInactive: { backgroundColor: '#6b7280' },
  onlineButtonTextActive: { color: '#ffffff', fontWeight: 'bold' },
  onlineButtonTextInactive: { color: '#6b7280', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', backgroundColor: '#f9fafb', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  rideContainer: { gap: 16 },
  rideCard: { backgroundColor: '#eff6ff', borderColor: '#dbeafe', padding: 16, borderRadius: 12 },
  rideTitle: { fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  rideStatus: { fontSize: 14, color: '#1e40af', marginBottom: 12 },
  emergencyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dc2626', padding: 8, borderRadius: 12, marginBottom: 16 },
  emergencyButtonText: { color: '#ffffff', fontWeight: 'bold' },
  passengerCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16 },
  passengerInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  passengerAvatar: { width: 48, height: 48, borderRadius: 24 },
  passengerDetails: { flex: 1 },
  passengerName: { fontWeight: 'bold', color: '#111827' },
  passengerDestination: { fontSize: 14, color: '#6b7280' },
  passengerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chatBadge: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: 6, borderWidth: 2, borderColor: '#ffffff' },
  shareText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  navButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  navButtonWaze: { flex: 1, backgroundColor: '#eff6ff', padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#dbeafe' },
  navButtonTextWaze: { fontWeight: 'bold', color: '#1d4ed8', fontSize: 12 },
  navButtonMaps: { flex: 1, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#dcfce7' },
  navButtonTextMaps: { fontWeight: 'bold', color: '#15803d', fontSize: 12 },
  actionButtonPrimary: { width: '100%', backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  actionButtonPrimaryText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { width: '100%', padding: 8, alignItems: 'center' },
  cancelButtonText: { color: '#dc2626', fontWeight: '600' },
  dashboardContainer: { gap: 12 },
  earningsPanel: { backgroundColor: '#22c55e', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsLabel: { fontSize: 12, color: '#ffffff', fontWeight: 'bold', textTransform: 'uppercase' },
  earningsValue: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  earningsIcon: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shortcutsGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  shortcutButton: { flex: 1, backgroundColor: '#f9fafb', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 12 },
  shortcutIconWrapper: { backgroundColor: 'rgba(37,99,235,0.1)', padding: 8, borderRadius: 12 },
  shortcutIconWrapperPurple: { backgroundColor: 'rgba(168,85,247,0.1)', padding: 8, borderRadius: 12 },
  shortcutText: { fontWeight: 'bold', color: '#111827', fontSize: 14 },
  vehiclePanel: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  vehicleLabel: { fontSize: 10, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  vehicleInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { fontWeight: 'bold', color: '#111827' },
  vehicleDetails: { fontSize: 14, color: '#6b7280' },
  vehicleRating: { backgroundColor: '#ffffff', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  ridesTitle: { fontSize: 12, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 },
  offlineContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  offlineText: { fontWeight: 'bold', color: '#111827' },
  offlineSubText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  goOnlineButton: { marginTop: 20, backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  goOnlineButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  rideItem: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 16, borderRadius: 16, gap: 16, marginBottom: 12 },
  rideItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rideItemInfo: { flex: 1 },
  rideItemLabel: { fontSize: 10, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  rideItemDestination: { fontWeight: 'bold', color: '#111827', fontSize: 16 },
  rideItemTags: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rideItemTagBlue: { backgroundColor: 'rgba(37,99,235,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rideItemTagTextBlue: { color: '#2563eb', fontSize: 10, fontWeight: 'bold' },
  rideItemTagGreen: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rideItemTagTextGreen: { color: '#16a34a', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  rideItemPriceContainer: { alignItems: 'flex-end' },
  rideItemPrice: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  acceptRideButton: { width: '100%', backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center' },
  acceptRideButtonText: { color: '#ffffff', fontWeight: 'bold' },
  noRidesContainer: { alignItems: 'center', paddingVertical: 48, backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  spinner: { width: 40, height: 40, borderWidth: 4, borderColor: '#e5e7eb', borderTopColor: '#2563eb', borderRadius: 20, marginBottom: 16 },
  noRidesText: { color: '#6b7280', fontWeight: '500' }
});
};
