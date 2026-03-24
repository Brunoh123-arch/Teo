import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, Landmark } from 'lucide-react';
import { rideService } from '../services/rideService';
import { toast } from 'sonner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

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

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
    }
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

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
    }
  }, [isOpen]);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  const handleAddFunds = async () => {
    setWithdrawing(true); // Reusing withdrawing state for loading
    try {
      const data = await rideService.addFunds(amountToAdd);
      setQrCode(data.qrCode);
      setQrCodeBase64(data.qrCodeBase64);
    } catch (error) {
      toast.error("Erro ao gerar PIX");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      toast.error("O valor mínimo para saque é R$ 10,00");
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      toast.error("Saldo insuficiente");
      return;
    }
    if (pixKey.length < 5) {
      toast.error("Informe uma chave PIX válida");
      return;
    }

    setWithdrawing(true);
    try {
      await rideService.requestWithdrawal(amount, pixKey);
      toast.success("Solicitação de saque enviada com sucesso!");
      setShowWithdraw(false);
      setWithdrawAmount('');
      setPixKey('');
      fetchWallet(); // Recarrega o saldo
    } catch (error: any) {
      toast.error(error.message || "Erro ao solicitar saque");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full rounded-t-3xl relative z-10 max-h-[90vh] flex flex-col shadow-2xl border-t border-white/50"
          >
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <h3 className="font-bold text-lg text-[var(--system-label)]">Sua Carteira</h3>
                <button
                  onClick={() => {
                    triggerHaptic();
                    onClose();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="w-8 h-8 border-4 border-[var(--system-blue)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Balance Card */}
                  <div className="bg-[var(--system-label)] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="relative z-10">
                      <p className="text-[var(--system-secondary-label)] text-sm mb-1">Saldo disponível</p>
                      <h2 className="text-4xl font-semibold mb-6">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(wallet?.balance || 0)}
                      </h2>
                      <div className="flex gap-3">
                        {role !== 'driver' && (
                          <button
                            onClick={() => {
                              triggerHaptic();
                              setShowAddFunds(true);
                              setShowWithdraw(false);
                            }}
                            className="flex-1 flex justify-center items-center gap-2 bg-white text-black px-4 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar
                          </button>
                        )}
                        {role === 'driver' && (
                          <button
                            onClick={() => {
                              triggerHaptic();
                              setShowWithdraw(true);
                              setShowAddFunds(false);
                            }}
                            className="flex-1 flex justify-center items-center gap-2 bg-[var(--system-green)] text-white px-4 py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
                          >
                            <Landmark className="w-4 h-4" />
                            Sacar
                          </button>
                        )}
                      </div>
                    </div>
                    <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
                  </div>

                  {/* Add Funds UI */}
                  {showAddFunds && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[var(--system-secondary-background)] rounded-3xl p-5 border border-gray-100 shadow-sm"
                    >
                      <h4 className="font-semibold text-[var(--system-label)] mb-4">Quanto deseja adicionar?</h4>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[20, 50, 100].map(val => (
                          <button
                            key={val}
                            onClick={() => {
                              triggerHaptic();
                              setAmountToAdd(val);
                            }}
                            className={`py-3 rounded-2xl font-semibold border-2 transition-all ${
                              amountToAdd === val ? 'bg-[var(--system-blue)] text-white border-[var(--system-blue)]' : 'bg-gray-50 text-[var(--system-label)] border-transparent'
                            }`}
                          >
                            R$ {val}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          triggerHaptic(ImpactStyle.Medium);
                          handleAddFunds();
                        }}
                        disabled={withdrawing}
                        className="w-full bg-[var(--system-blue)] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-blue-200 disabled:opacity-50"
                      >
                        {withdrawing ? 'Gerando PIX...' : 'Gerar PIX'}
                      </button>
                      {qrCode && (
                        <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100">
                          <p className="text-xs font-semibold text-[var(--system-secondary-label)] mb-2">Escaneie o QR Code ou copie a chave:</p>
                          <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-2" />
                          <button 
                            onClick={() => {
                              triggerHaptic();
                              navigator.clipboard.writeText(qrCode);
                              toast.success("Chave PIX copiada!");
                            }}
                            className="w-full text-xs bg-gray-50 p-3 rounded-xl break-all font-mono text-[var(--system-label)]"
                          >
                            {qrCode}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Withdraw UI */}
                  {showWithdraw && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[var(--system-secondary-background)] rounded-3xl p-5 border border-gray-100 shadow-sm"
                    >
                      <h4 className="font-semibold text-[var(--system-label)] mb-4">Solicitar Saque (PIX)</h4>
                      
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--system-secondary-label)] mb-1">Valor (R$)</label>
                          <input 
                            type="number" 
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Ex: 50.00"
                            className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:border-[var(--system-blue)] outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--system-secondary-label)] mb-1">Chave PIX</label>
                          <input 
                            type="text" 
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            placeholder="Sua chave PIX"
                            className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:border-[var(--system-blue)] outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          triggerHaptic(ImpactStyle.Medium);
                          handleWithdraw();
                        }}
                        disabled={withdrawing}
                        className="w-full bg-[var(--system-green)] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-green-200 disabled:opacity-50"
                      >
                        {withdrawing ? 'Processando...' : 'Confirmar Saque'}
                      </button>
                    </motion.div>
                  )}

                  {/* Transactions */}
                  <div>
                    <h4 className="font-semibold text-[var(--system-label)] mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[var(--system-secondary-label)]" />
                      Atividades Recentes
                    </h4>
                    <div className="space-y-3">
                      {wallet?.transactions.length === 0 ? (
                        <div className="text-center py-8 text-[var(--system-secondary-label)]">
                          Nenhuma transação encontrada.
                        </div>
                      ) : (
                        wallet?.transactions.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-4 bg-[var(--system-secondary-background)] rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                t.type === 'credit' ? 'bg-green-50 text-[var(--system-green)]' : 'bg-red-50 text-[var(--system-red)]'
                              }`}>
                                {t.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--system-label)]">{t.description}</p>
                                <p className="text-xs text-[var(--system-secondary-label)]">
                                  {t.createdAt?._seconds ? new Date(t.createdAt._seconds * 1000).toLocaleDateString('pt-BR') : t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR') : 'Data Indisponível'} 
                                  {' '}
                                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                                    t.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {t.status === 'completed' ? 'Concluído' : t.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <p className={`font-semibold ${t.type === 'credit' ? 'text-[var(--system-green)]' : 'text-[var(--system-label)]'}`}>
                              {t.type === 'credit' ? '+' : '-'} {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(t.amount)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
