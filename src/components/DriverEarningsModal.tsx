import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Calendar, Clock, Star, ChevronRight, Wallet, ArrowUpRight } from 'lucide-react';
import { userService } from '../services/userService';
import { Skeleton } from './Skeleton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DriverEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverEarningsModal: React.FC<DriverEarningsModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEarnings();
    }
  }, [isOpen]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const data = await userService.getDriverEarnings();
      setEarningsData(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Hoje', value: earningsData?.today || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Esta Semana', value: earningsData?.week || 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Este Mês', value: earningsData?.month || 0, icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

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
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full h-[90vh] rounded-t-3xl flex flex-col relative z-10 shadow-2xl overflow-hidden border-t border-white/50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20 rounded-t-3xl">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <h3 className="font-bold text-lg text-[var(--system-label)]">Ganhos do Motorista</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--system-background)] p-4 space-y-6">
              {loading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                  </div>
                  <Skeleton className="h-64 rounded-2xl" />
                  <Skeleton className="h-48 rounded-2xl" />
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat, idx) => (
                      <div key={idx} className={`${stat.bg} p-4 rounded-2xl border border-white/50 shadow-sm`}>
                        <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-lg font-black ${stat.color}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.value)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Desempenho Semanal
                    </h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={earningsData?.chartData || []}>
                          <defs>
                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                            tickFormatter={(value) => `R$${value}`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`R$ ${value}`, 'Ganhos']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorEarnings)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Secondary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className="bg-yellow-50 p-3 rounded-xl">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Avaliação</p>
                        <p className="text-xl font-black text-gray-900">{earningsData?.rating?.toFixed(1) || '5.0'}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Online</p>
                        <p className="text-xl font-black text-gray-900">{earningsData?.onlineHours || 0}h</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center">
                      <h4 className="font-bold text-gray-900">Atividades Recentes</h4>
                      <button className="text-xs font-bold text-blue-600">Ver Tudo</button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {earningsData?.recentRides?.length > 0 ? (
                        earningsData.recentRides.map((ride: any, idx: number) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2 rounded-lg">
                                <ArrowUpRight className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{ride.destName}</p>
                                <p className="text-[10px] text-gray-500 font-medium">{new Date(ride.createdAt).toLocaleDateString()} • {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-green-600">
                                +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ride.driverEarnings)}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{ride.status === 'completed' ? 'Concluída' : 'Cancelada'}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          Nenhuma atividade recente.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Withdrawal CTA */}
                  <div className="bg-gray-900 p-6 rounded-2xl text-white flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Saldo Disponível</p>
                      <p className="text-2xl font-black">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningsData?.balance || 0)}
                      </p>
                    </div>
                    <button className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors">
                      Sacar Agora
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
