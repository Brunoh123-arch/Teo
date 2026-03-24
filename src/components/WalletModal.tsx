import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, ScrollView, Alert, Image, Clipboard, Platform } from 'react-native';
import { X, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, Landmark } from 'lucide-react';
import { rideService } from '../services/rideService';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

interface WalletData {
  balance: number;
  transactions: any[];
}

export const WalletModal = ({ isOpen, onClose, role }: { isOpen: boolean, onClose: () => void, role?: string }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState(20);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const triggerHaptic = async (style: ImpactFeedbackStyle = ImpactFeedbackStyle.Light) => {
    await impactAsync(style);
  };

  const fetchWallet = async () => {
    try {
      const data = await rideService.getWallet();
      setWallet(data);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    setWithdrawing(true);
    try {
      const data = await rideService.addFunds(amountToAdd);
      setQrCode(data.qrCode);
      setQrCodeBase64(data.qrCodeBase64);
    } catch (error) {
      Alert.alert("Erro", "Erro ao gerar PIX");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      Alert.alert("Erro", "O valor mínimo para saque é R$ 10,00");
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      Alert.alert("Erro", "Saldo insuficiente");
      return;
    }
    if (pixKey.length < 5) {
      Alert.alert("Erro", "Informe uma chave PIX válida");
      return;
    }

    setWithdrawing(true);
    try {
      await rideService.requestWithdrawal(amount, pixKey);
      Alert.alert("Sucesso", "Solicitação de saque enviada com sucesso!");
      setShowWithdraw(false);
      setWithdrawAmount('');
      setPixKey('');
      fetchWallet();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao solicitar saque");
    } finally {
      setWithdrawing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={onClose}
      />
      <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Sua Carteira</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Carregando...</Text>
            </View>
          ) : (
            <View style={styles.walletContainer}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Saldo disponível</Text>
                <Text style={styles.balanceAmount}>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(wallet?.balance || 0)}
                </Text>
                <View style={styles.balanceActions}>
                  {role !== 'driver' && (
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic();
                        setShowAddFunds(true);
                        setShowWithdraw(false);
                      }}
                      style={styles.actionButton}
                    >
                      <Plus size={16} color="#000" />
                      <Text style={styles.actionButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                  )}
                  {role === 'driver' && (
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic();
                        setShowWithdraw(true);
                        setShowAddFunds(false);
                      }}
                      style={[styles.actionButton, styles.withdrawButton]}
                    >
                      <Landmark size={16} color="#fff" />
                      <Text style={[styles.actionButtonText, styles.withdrawButtonText]}>Sacar</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Wallet size={128} color="rgba(255,255,255,0.1)" style={styles.balanceIcon} />
              </View>

              {showAddFunds && (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>Quanto deseja adicionar?</Text>
                  <View style={styles.amountGrid}>
                    {[20, 50, 100].map(val => (
                      <TouchableOpacity
                        key={val}
                        onPress={() => {
                          triggerHaptic();
                          setAmountToAdd(val);
                        }}
                        style={[styles.amountButton, amountToAdd === val && styles.amountButtonSelected]}
                      >
                        <Text style={[styles.amountButtonText, amountToAdd === val && styles.amountButtonTextSelected]}>R$ {val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic(ImpactFeedbackStyle.Medium);
                      handleAddFunds();
                    }}
                    disabled={withdrawing}
                    style={styles.submitButton}
                  >
                    <Text style={styles.submitButtonText}>{withdrawing ? 'Gerando PIX...' : 'Gerar PIX'}</Text>
                  </TouchableOpacity>
                  {qrCode && (
                    <View style={styles.qrContainer}>
                      <Text style={styles.qrLabel}>Escaneie o QR Code ou copie a chave:</Text>
                      <Image source={{ uri: `data:image/png;base64,${qrCodeBase64}` }} style={styles.qrCode} />
                      <TouchableOpacity 
                        onPress={() => {
                          triggerHaptic();
                          Clipboard.setString(qrCode);
                          Alert.alert("Sucesso", "Chave PIX copiada!");
                        }}
                        style={styles.pixKeyButton}
                      >
                        <Text style={styles.pixKeyText}>{qrCode}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {showWithdraw && (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>Solicitar Saque (PIX)</Text>
                  <TextInput 
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    placeholder="Valor (R$)"
                    style={styles.input}
                  />
                  <TextInput 
                    value={pixKey}
                    onChangeText={setPixKey}
                    placeholder="Sua chave PIX"
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic(ImpactFeedbackStyle.Medium);
                      handleWithdraw();
                    }}
                    disabled={withdrawing}
                    style={[styles.submitButton, styles.withdrawSubmitButton]}
                  >
                    <Text style={styles.submitButtonText}>{withdrawing ? 'Processando...' : 'Confirmar Saque'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View>
                <Text style={styles.sectionTitle}>
                  <Clock size={20} color="#6b7280" /> Atividades Recentes
                </Text>
                <View style={styles.transactionsList}>
                  {wallet?.transactions.length === 0 ? (
                    <Text style={styles.noTransactions}>Nenhuma transação encontrada.</Text>
                  ) : (
                    wallet?.transactions.map((t: any) => (
                      <View key={t.id} style={styles.transactionItem}>
                        <View style={styles.transactionInfo}>
                          <View style={[styles.transactionIcon, t.type === 'credit' ? styles.creditIcon : styles.debitIcon]}>
                            {t.type === 'credit' ? <ArrowDownLeft size={20} color={t.type === 'credit' ? '#16a34a' : '#dc2626'} /> : <ArrowUpRight size={20} color={t.type === 'credit' ? '#16a34a' : '#dc2626'} />}
                          </View>
                          <View>
                            <Text style={styles.transactionDescription}>{t.description}</Text>
                            <Text style={styles.transactionDate}>
                              {t.createdAt?._seconds ? new Date(t.createdAt._seconds * 1000).toLocaleDateString('pt-BR') : t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR') : 'Data Indisponível'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.transactionAmount, t.type === 'credit' ? styles.creditAmount : styles.debitAmount]}>
                          {t.type === 'credit' ? '+' : '-'} {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(t.amount)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create<any>({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  walletContainer: {
    gap: 24,
  },
  balanceCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  balanceLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  withdrawButton: {
    backgroundColor: '#16a34a',
  },
  withdrawButtonText: {
    color: '#ffffff',
  },
  balanceIcon: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    transform: [{ rotate: '12deg' }],
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  formTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  amountButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  amountButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  amountButtonText: {
    fontWeight: '600',
    color: '#111827',
  },
  amountButtonTextSelected: {
    color: '#2563eb',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  withdrawSubmitButton: {
    backgroundColor: '#16a34a',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  qrContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  qrCode: {
    width: 192,
    height: 192,
    marginBottom: 8,
  },
  pixKeyButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  pixKeyText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#111827',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionsList: {
    gap: 12,
  },
  noTransactions: {
    textAlign: 'center',
    padding: 32,
    color: '#6b7280',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditIcon: {
    backgroundColor: '#f0fdf4',
  },
  debitIcon: {
    backgroundColor: '#fef2f2',
  },
  transactionDescription: {
    fontWeight: '600',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionAmount: {
    fontWeight: '600',
  },
  creditAmount: {
    color: '#16a34a',
  },
  debitAmount: {
    color: '#111827',
  },
});
