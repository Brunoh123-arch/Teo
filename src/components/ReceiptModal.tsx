import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { X, Receipt, MapPin, Calendar, CreditCard, User } from 'lucide-react-native';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  ride,
}: ReceiptModalProps) => {
  if (!isOpen || !ride) return null;

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
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerTitleContainer}>
                <Receipt size={20} color="#2563eb" />
                <Text style={styles.headerTitle}>Recibo da Viagem</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.summaryContainer}>
              <View style={styles.iconContainer}>
                <Receipt size={32} color="#2563eb" />
              </View>
              <Text style={styles.price}>{formatCurrency(ride.price)}</Text>
              <Text style={styles.thankYou}>Obrigado por viajar conosco!</Text>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Calendar size={20} color="#6b7280" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>DATA E HORA</Text>
                  <Text style={styles.detailValue}>{formatDate(ride.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MapPin size={20} color="#16a34a" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>ORIGEM</Text>
                  <Text style={styles.detailValue}>{ride.originName || 'Local de partida'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MapPin size={20} color="#dc2626" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>DESTINO</Text>
                  <Text style={styles.detailValue}>{ride.destName}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <CreditCard size={20} color="#6b7280" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>PAGAMENTO</Text>
                  <Text style={styles.detailValue}>{ride.paymentMethod || 'PIX'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <User size={20} color="#6b7280" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>MOTORISTA</Text>
                  <Text style={styles.detailValue}>{ride.driverName || 'N/A'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Detalhamento</Text>
              <View style={styles.breakdownBox}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Tarifa Base</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(ride.price * 0.8)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Taxas e Impostos</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(ride.price * 0.2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(ride.price)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonFull}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', paddingBottom: 20 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  handle: { width: 40, height: 6, backgroundColor: '#d1d5db', borderRadius: 3, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  closeButton: { padding: 8 },
  body: { flex: 1, padding: 24 },
  summaryContainer: { alignItems: 'center', marginBottom: 24 },
  iconContainer: { width: 64, height: 64, backgroundColor: '#eff6ff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  price: { fontSize: 30, fontWeight: 'bold', color: '#111827' },
  thankYou: { fontSize: 14, color: '#6b7280' },
  detailsContainer: { backgroundColor: '#ffffff', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: 'bold', color: '#6b7280', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  breakdownContainer: { marginBottom: 24 },
  breakdownTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8, paddingHorizontal: 4 },
  breakdownBox: { backgroundColor: '#f9fafb', borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  breakdownLabel: { fontSize: 14, color: '#6b7280' },
  breakdownValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#e5e7eb' },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#ffffff' },
  closeButtonFull: { width: '100%', backgroundColor: '#2563eb', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
