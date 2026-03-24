import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { FileText, Camera, CheckCircle, Clock, ArrowLeft } from 'lucide-react-native';
import { userService } from '../services/userService';

interface DriverVerificationProps {
  onClose: () => void;
  user: any;
}

export const DriverVerification: React.FC<DriverVerificationProps> = ({ onClose, user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cnhNumber: '',
    plate: '',
    model: '',
    color: '',
    year: ''
  });
  const [docs, setDocs] = useState<{
    cnh: any | null;
    crlv: any | null;
    selfie: any | null;
  }>({
    cnh: null,
    crlv: null,
    selfie: null,
  });

  const handleFileChange = (type: 'cnh' | 'crlv' | 'selfie') => {
    // Placeholder for document picker integration
    Alert.alert("Document Picker", `Implementar seleção de arquivo para ${type}`);
  };

  const handleUpload = async () => {
    // Placeholder for upload logic
    Alert.alert("Upload", "Implementar lógica de upload para React Native");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seja um Motorista</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.centered}>
          <View style={styles.iconContainer}>
            <FileText size={40} color="#2563eb" />
          </View>
          <Text style={styles.title}>Verificação de Conta</Text>
          <Text style={styles.subtitle}>Para sua segurança e de nossos passageiros, precisamos verificar seus documentos.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Veículo e CNH</Text>
          <Text style={styles.label}>CNH (Número)</Text>
          <TextInput
            style={styles.input}
            value={formData.cnhNumber}
            onChangeText={(text) => setFormData({...formData, cnhNumber: text})}
            placeholder="Número da sua CNH"
          />
          <Text style={styles.label}>Placa do Veículo</Text>
          <TextInput
            style={styles.input}
            value={formData.plate}
            onChangeText={(text) => setFormData({...formData, plate: text})}
            placeholder="Ex: ABC-1234"
          />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Modelo</Text>
              <TextInput
                style={styles.input}
                value={formData.model}
                onChangeText={(text) => setFormData({...formData, model: text})}
                placeholder="Ex: Onix"
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.label}>Cor</Text>
              <TextInput
                style={styles.input}
                value={formData.color}
                onChangeText={(text) => setFormData({...formData, color: text})}
                placeholder="Ex: Prata"
              />
            </View>
          </View>
          <Text style={styles.label}>Ano</Text>
          <TextInput
            style={styles.input}
            value={formData.year}
            onChangeText={(text) => setFormData({...formData, year: text})}
            placeholder="Ex: 2020"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos dos Documentos</Text>
          <TouchableOpacity style={styles.docItem} onPress={() => handleFileChange('cnh')}>
            <CheckCircle size={24} color={docs.cnh ? '#22c55e' : '#d1d5db'} />
            <View>
              <Text style={styles.docTitle}>CNH {docs.cnh && <Text style={styles.selected}>(Selecionado)</Text>}</Text>
              <Text style={styles.docSubtitle}>Carteira Nacional de Habilitação válida.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.docItem} onPress={() => handleFileChange('crlv')}>
            <CheckCircle size={24} color={docs.crlv ? '#22c55e' : '#d1d5db'} />
            <View>
              <Text style={styles.docTitle}>CRLV {docs.crlv && <Text style={styles.selected}>(Selecionado)</Text>}</Text>
              <Text style={styles.docSubtitle}>Documento do veículo atualizado.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.docItem} onPress={() => handleFileChange('selfie')}>
            <Camera size={24} color={docs.selfie ? '#3b82f6' : '#d1d5db'} />
            <View>
              <Text style={styles.docTitle}>Selfie {docs.selfie && <Text style={styles.selected}>(Selecionado)</Text>}</Text>
              <Text style={styles.docSubtitle}>Uma foto sua segurando o documento.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <Clock size={24} color="#b45309" />
          <Text style={styles.warningText}>A análise dos documentos pode levar até 24 horas úteis.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleUpload}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar Documentos</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1, padding: 24 },
  centered: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { width: 80, height: 80, backgroundColor: '#eff6ff', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtitle: { color: '#6b7280', textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontWeight: 'bold', color: '#111827', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'medium', color: '#374151', marginBottom: 4 },
  input: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  flex1: { flex: 1 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 12 },
  docTitle: { fontWeight: 'bold', color: '#111827' },
  selected: { fontSize: 12, color: '#16a34a' },
  docSubtitle: { fontSize: 12, color: '#6b7280' },
  warningBox: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fef3c7', borderRadius: 16, marginBottom: 32 },
  warningText: { fontSize: 14, color: '#92400e', flex: 1 },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  submitButton: { width: '100%', backgroundColor: '#2563eb', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { opacity: 0.5 },
  submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
