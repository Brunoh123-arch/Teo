import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { signInWithGoogle } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error("Login error:", error);
    }
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
            <Text style={styles.title}>Entrar</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
            >
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Escolha uma opção para continuar.
          </Text>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={styles.googleButton}
          >
            <Text style={styles.buttonText}>Continuar com Google</Text>
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
  handle: { width: 40, height: 6, backgroundColor: '#d1d5db', borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  closeButton: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 24 },
  googleButton: { width: '100%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#111827' }
});
