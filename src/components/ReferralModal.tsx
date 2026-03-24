import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Share2, Copy, Check, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { userService } from '../services/userService';
import { Skeleton } from './Skeleton';
import { toast } from 'sonner';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [referralCode, setReferralCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReferralInfo();
    }
  }, [isOpen]);

  const fetchReferralInfo = async () => {
    setLoading(true);
    try {
      const data = await userService.getReferralInfo();
      setReferralInfo(data);
    } catch (error) {
      console.error('Error fetching referral info:', error);
      // Fallback for demo
      setReferralInfo({
        code: 'RIDEFLOW2026',
        rewardAmount: 10,
        totalReferrals: 5,
        totalEarned: 50,
        pendingReferrals: 2
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCode = async () => {
    if (!referralCode.trim()) return;
    setApplying(true);
    try {
      await userService.applyReferralCode(referralCode);
      toast.success('Código aplicado com sucesso!');
      setReferralCode('');
      fetchReferralInfo();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aplicar código');
    } finally {
      setApplying(false);
    }
  };

  const copyToClipboard = () => {
    if (referralInfo?.code) {
      navigator.clipboard.writeText(referralInfo.code);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ganhe R$ 10,00 no RideFlow!',
          text: `Use meu código ${referralInfo?.code} para ganhar R$ 10,00 de desconto na sua primeira corrida no RideFlow!`,
          url: window.location.origin,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto">
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
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full h-[85vh] rounded-t-3xl flex flex-col relative z-10 shadow-2xl overflow-hidden border-t border-white/50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-lg text-[var(--system-label)]">Indique e Ganhe</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              {loading ? (
                <div className="p-6 space-y-6">
                  <Skeleton className="h-48 rounded-3xl" />
                  <Skeleton className="h-24 rounded-2xl" />
                  <Skeleton className="h-32 rounded-2xl" />
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Hero Card */}
                  <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
                    
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                        <Gift className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-black mb-2">Ganhe R$ {referralInfo?.rewardAmount || 10},00</h2>
                      <p className="text-purple-100 text-sm leading-relaxed">
                        Indique amigos e ganhe créditos na sua carteira para cada amigo que completar a primeira corrida.
                      </p>
                    </div>
                  </div>

                  {/* Referral Code Section */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Seu Código de Indicação</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 p-4 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl font-black text-gray-900 tracking-widest uppercase">{referralInfo?.code}</span>
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                      </button>
                    </div>
                    <button 
                      onClick={shareReferral}
                      className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors shadow-md"
                    >
                      <Share2 className="w-5 h-5" />
                      Compartilhar Link
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amigos Indicados</p>
                      <p className="text-2xl font-black text-gray-900">{referralInfo?.totalReferrals || 0}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-green-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Ganho</p>
                      <p className="text-2xl font-black text-gray-900">R$ {referralInfo?.totalEarned || 0}</p>
                    </div>
                  </div>

                  {/* Apply Code Section */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-600" />
                      Foi indicado por alguém?
                    </h4>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="Insira o código aqui"
                        className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button 
                        onClick={handleApplyCode}
                        disabled={applying || !referralCode.trim()}
                        className="bg-gray-900 text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50"
                      >
                        {applying ? '...' : <ArrowRight className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="space-y-4 pb-8">
                    <h4 className="font-bold text-gray-900">Como funciona?</h4>
                    <div className="space-y-4">
                      {[
                        { step: '01', title: 'Compartilhe seu código', desc: 'Envie seu código único para seus amigos.' },
                        { step: '02', title: 'Amigo se cadastra', desc: 'Seu amigo usa seu código ao se cadastrar ou na primeira corrida.' },
                        { step: '03', title: 'Amigo viaja', desc: 'Assim que seu amigo completar a primeira viagem, você ganha créditos.' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="text-xl font-black text-purple-200 leading-none">{item.step}</div>
                          <div>
                            <h5 className="font-bold text-sm text-gray-900 mb-0.5">{item.title}</h5>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                      ))}
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
