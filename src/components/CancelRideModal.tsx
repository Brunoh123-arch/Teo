import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';

export const CancelRideModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (reason: string) => void }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    if (!reason) {
      return;
    }
    setSubmitting(true);
    onConfirm(reason);
    onClose();
    setSubmitting(false);
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
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <AlertTriangle size={20} color="#dc2626" />
              <Text style={styles.headerTitle}>Cancelar Viagem</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>Tem certeza que deseja cancelar esta viagem? Isso pode gerar taxas de cancelamento.</Text>

          <View style={styles.reasonsContainer}>
            {['Motorista demorou', 'Mudei de ideia', 'Endereço errado', 'Outro'].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setReason(r)}
                style={[
                  styles.reasonButton,
                  reason === r ? styles.selectedReason : styles.unselectedReason
                ]}
              >
                <Text style={[styles.reasonText, reason === r ? styles.selectedReasonText : styles.unselectedReasonText]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={submitting || !reason}
            style={[styles.confirmButton, (submitting || !reason) && styles.disabledButton]}
          >
            <Text style={styles.confirmButtonText}>Confirmar Cancelamento</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  handle: { width: 40, height: 6, backgroundColor: '#d1d5db', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#dc2626' },
  closeButton: { padding: 8 },
  description: { fontSize: 16, color: '#4b5563', marginBottom: 24 },
  reasonsContainer: { gap: 12, marginBottom: 24 },
  reasonButton: { padding: 16, borderRadius: 12, borderWidth: 2 },
  unselectedReason: { borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  selectedReason: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  reasonText: { fontWeight: 'bold' },
  unselectedReasonText: { color: '#111827' },
  selectedReasonText: { color: '#b91c1c' },
  confirmButton: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626' },
  disabledButton: { opacity: 0.5 },
  confirmButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
