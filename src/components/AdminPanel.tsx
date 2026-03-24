import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Skeleton } from './Skeleton';
import { toast } from 'sonner';
import { userService } from '../services/userService';
import { CheckCircle, XCircle, Clock, BarChart3, TrendingUp, Users, MessageSquare, Banknote, Map as MapIcon, ShieldAlert, UserX, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChatModal } from './ChatModal';
import { rideService } from '../services/rideService';
import { auth } from '../firebase';
import { socketService } from '../services/socketService';

interface AdminPanelProps {
  showHeatmap?: boolean;
  setShowHeatmap?: (show: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ showHeatmap, setShowHeatmap }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [pricing, setPricing] = useState({ baseFare: 5.0, perKm: 1.5, perMin: 0.3, surgeEnabled: false, surgeMultiplier: 1.5 });
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);

  // Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifImage, setNotifImage] = useState('');
  const [notifActionUrl, setNotifActionUrl] = useState('');
  const [notifTargetUserId, setNotifTargetUserId] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Coupon State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    usageLimit: '',
    expiryDate: '',
    description: ''
  });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Support Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  const handleOpenTicketChat = async (ticketId: string) => {
    setActiveTicketId(ticketId);
    setIsChatOpen(true);
    setLoadingMessages(true);
    socketService.joinSupportTicket(ticketId);
    try {
      const messages = await rideService.getAdminSupportTicketMessages(ticketId);
      setChatMessages(messages);
    } catch (error) {
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isChatOpen && activeTicketId) {
      const handleNewMessage = (message: any) => {
        setChatMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      };

      socketService.onNewSupportMessage(handleNewMessage);
      return () => {
        socketService.off("new-support-message");
      };
    }
  }, [isChatOpen, activeTicketId]);

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicketId) return;

    const text = newMessage;
    setNewMessage('');
    try {
      const sentMsg = await rideService.sendAdminSupportTicketMessage(activeTicketId, text);
      setChatMessages(prev => [...prev, sentMsg]);
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      setNewMessage(text);
    }
  };

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const qRides = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
    const qTemplates = query(collection(db, 'notification_templates'), orderBy('name', 'asc'));

    const unsubUsers = onSnapshot(qUsers, (snap) => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubRides = onSnapshot(qRides, (snap) => {
      setRides(snap.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    });
    const unsubTemplates = onSnapshot(qTemplates, (snap) => setTemplates(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    // Fetch documents, pricing and audit logs
    userService.getPendingDocuments().then(setDocuments).catch(console.error);
    userService.getPricingSettings().then(setPricing).catch(console.error);
    userService.getAuditLogs().then(setAuditLogs).catch(console.error);
    
    // Fetch withdrawals, coupons and support tickets
    fetchWithdrawals();
    fetchCoupons();
    fetchSupportTickets();

    return () => { unsubUsers(); unsubRides(); unsubTemplates(); };
  }, []);

  const getRideStats = () => {
    const stats: Record<string, { rides: number, earnings: number }> = {};
    rides.forEach(r => {
      const date = r.createdAt?.toDate().toLocaleDateString('pt-BR').slice(0, 5);
      if (!date) return;
      if (!stats[date]) stats[date] = { rides: 0, earnings: 0 };
      stats[date].rides += 1;
      stats[date].earnings += (r.price || 0);
    });
    return Object.entries(stats).map(([date, data]) => ({ date, ...data })).slice(-7);
  };

  const rideStats = getRideStats();

  const fetchWithdrawals = async () => {
    try {
      const data = await userService.getWithdrawals();
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await userService.getCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const data = await userService.getAllSupportTickets();
      setSupportTickets(data);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: 'complete' | 'reject') => {
    setProcessingWithdrawal(id);
    try {
      await userService.processWithdrawal(id, action);
      toast.success(`Saque ${action === 'complete' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar saque');
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCoupon(true);
    try {
      await userService.createCoupon({
        ...newCoupon,
        usageLimit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : undefined
      });
      toast.success('Cupom criado com sucesso!');
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        usageLimit: '',
        expiryDate: '',
        description: ''
      });
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar cupom');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cupom ${code}?`)) return;
    try {
      await userService.deleteCoupon(code);
      toast.success('Cupom excluído!');
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir cupom');
    }
  };

  const handleUpdateTicketStatus = async (id: string, status: string) => {
    try {
      await userService.updateSupportTicketStatus(id, status);
      toast.success('Status do ticket atualizado!');
      fetchSupportTickets();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar ticket');
    }
  };

  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      await userService.updatePricingSettings(pricing);
      toast.success('Tarifas atualizadas com sucesso!');
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error('Erro ao atualizar tarifas.');
    } finally {
      setSavingPricing(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await userService.getAuditLogs();
      setAuditLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleApproveDriver = async (userId: string) => {
    try {
      await userService.updateDriverStatus(userId, 'approved');
      toast.success('Motorista aprovado com sucesso!');
      fetchAuditLogs();
    } catch (error) {
      console.error('Error approving driver:', error);
      toast.error('Erro ao aprovar motorista.');
    }
  };

  const handleRejectDriver = async (userId: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    try {
      await userService.updateDriverStatus(userId, 'rejected', reason);
      toast.success('Motorista rejeitado.');
      fetchAuditLogs();
    } catch (error) {
      console.error('Error rejecting driver:', error);
      toast.error('Erro ao rejeitar motorista.');
    }
  };

  const handleToggleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await userService.updateUserBlockStatus(userId, !isBlocked);
      toast.success(isBlocked ? 'Usuário desbloqueado!' : 'Usuário bloqueado!');
      fetchAuditLogs();
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast.error('Erro ao alterar status do usuário.');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) return;
    if (notifTarget === 'specific' && !notifTargetUserId) {
      toast.error('Selecione um usuário específico');
      return;
    }
    
    setSendingNotif(true);
    try {
      const res = await userService.sendNotification({ 
        title: notifTitle, 
        body: notifBody, 
        target: notifTarget,
        targetUserId: notifTarget === 'specific' ? notifTargetUserId : undefined,
        imageUrl: notifImage || undefined,
        actionUrl: notifActionUrl || undefined
      });
      toast.success(`Notificação enviada! (${res.successCount} entregues)`);
      setNotifTitle('');
      setNotifBody('');
      setNotifImage('');
      setNotifActionUrl('');
      setNotifTargetUserId('');
      setUserSearchTerm('');
      // Refresh audit logs to show the new one
      userService.getAuditLogs().then(setAuditLogs).catch(console.error);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar notificação');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!notifTitle || !notifBody) {
      toast.error('Preencha título e mensagem para salvar como template');
      return;
    }
    const name = prompt('Nome do template:');
    if (!name) return;

    try {
      await userService.saveNotificationTemplate({
        name,
        title: notifTitle,
        body: notifBody,
        imageUrl: notifImage,
        actionUrl: notifActionUrl
      });
      toast.success('Template salvo!');
    } catch (error) {
      toast.error('Erro ao salvar template');
    }
  };

  const loadTemplate = (template: any) => {
    setNotifTitle(template.title);
    setNotifBody(template.body);
    setNotifImage(template.imageUrl || '');
    setNotifActionUrl(template.actionUrl || '');
    toast.info(`Template "${template.name}" carregado`);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  ).slice(0, 5);

  if (loading) return <div className="p-4 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" /></div>;

  const pendingDrivers = users.filter(u => u.driverStatus === 'pending');

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Painel Administrativo</h2>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-600 text-white rounded-lg"><Users size={24} /></div>
            <h4 className="text-sm font-bold text-blue-900 uppercase">Total Usuários</h4>
          </div>
          <p className="text-3xl font-black text-blue-950">{users.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-green-600 text-white rounded-lg"><BarChart3 size={24} /></div>
            <h4 className="text-sm font-bold text-green-900 uppercase">Viagens Totais</h4>
          </div>
          <p className="text-3xl font-black text-green-950">{rides.length}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-purple-600 text-white rounded-lg"><TrendingUp size={24} /></div>
            <h4 className="text-sm font-bold text-purple-900 uppercase">Receita Total</h4>
          </div>
          <p className="text-3xl font-black text-purple-950">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rides.reduce((acc, r) => acc + (r.price || 0), 0))}
          </p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-600 text-white rounded-lg"><Banknote size={24} /></div>
            <h4 className="text-sm font-bold text-orange-900 uppercase">Comissão (15%)</h4>
          </div>
          <p className="text-3xl font-black text-orange-950">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rides.reduce((acc, r) => acc + (r.price || 0), 0) * 0.15)}
          </p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-600 text-white rounded-lg"><UserCheck size={24} /></div>
            <h4 className="text-sm font-bold text-emerald-900 uppercase">Motoristas Online</h4>
          </div>
          <p className="text-3xl font-black text-emerald-950">{users.filter(u => u.isOnline).length}</p>
        </div>
        <div className="bg-rose-50 p-6 rounded-xl border border-rose-100">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-rose-600 text-white rounded-lg"><Clock size={24} /></div>
            <h4 className="text-sm font-bold text-rose-900 uppercase">Corridas Ativas</h4>
          </div>
          <p className="text-3xl font-black text-rose-950">{rides.filter(r => ['accepted', 'arrived', 'in_progress'].includes(r.status)).length}</p>
        </div>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-600 text-white rounded-lg"><MapIcon size={24} /></div>
            <h4 className="text-sm font-bold text-indigo-900 uppercase">Mapa de Calor</h4>
          </div>
          <button 
            onClick={() => setShowHeatmap?.(!showHeatmap)}
            className={`mt-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${showHeatmap ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
          >
            {showHeatmap ? 'Desativar Heatmap' : 'Ativar Heatmap'}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Viagens por Dia (Últimos 7 dias)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rideStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rides" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Receita por Dia (R$)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rideStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="earnings" stroke="#7c3aed" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* User Management */}
      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Gestão de Usuários</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Buscar usuário..." 
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="p-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.filter(u => 
                u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
              ).slice(0, 10).map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={u.photoURL || `https://i.pravatar.cc/150?u=${u.id}`} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="text-sm font-bold">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={`px-2 py-1 rounded-full font-bold uppercase ${u.driverStatus === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.driverStatus === 'approved' ? 'Motorista' : 'Passageiro'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={`px-2 py-1 rounded-full font-bold uppercase ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.isBlocked ? 'Bloqueado' : 'Ativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleBlockUser(u.id, u.isBlocked)}
                        className={`p-2 rounded-lg transition-colors ${u.isBlocked ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        title={u.isBlocked ? "Desbloquear" : "Bloquear"}
                      >
                        {u.isBlocked ? <UserCheck size={18} /> : <UserX size={18} />}
                      </button>
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pendingDrivers.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-2 text-yellow-600">Motoristas Pendentes ({pendingDrivers.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documentos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingDrivers.map(u => {
                  const userDocs = documents.find(d => d.userId === u.id);
                  return (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p><span className="font-semibold">CNH:</span> {u.driverData?.cnh || u.cnh || 'Não informado'}</p>
                          <p><span className="font-semibold">Placa:</span> {u.driverData?.vehicle?.plate || u.driverData?.plate || u.vehicle?.plate || 'Não informado'}</p>
                          <p><span className="font-semibold">Modelo:</span> {u.driverData?.vehicle?.model || u.driverData?.model || u.vehicle?.model || 'Não informado'}</p>
                          <p><span className="font-semibold">Cor:</span> {u.driverData?.vehicle?.color || u.driverData?.color || u.vehicle?.color || 'Não informado'}</p>
                          <p><span className="font-semibold">Ano:</span> {u.driverData?.vehicle?.year || u.driverData?.year || u.vehicle?.year || 'Não informado'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {userDocs?.cnhUrl ? (
                            <a href={userDocs.cnhUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">Ver CNH</a>
                          ) : (
                            <span className="text-red-500 text-sm">Sem CNH</span>
                          )}
                          {userDocs?.crlvUrl ? (
                            <a href={userDocs.crlvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">Ver CRLV</a>
                          ) : (
                            <span className="text-red-500 text-sm">Sem CRLV</span>
                          )}
                          {userDocs?.selfieUrl && (
                            <a href={userDocs.selfieUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">Ver Selfie</a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <button onClick={() => handleApproveDriver(u.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-bold hover:bg-green-200">Aprovar</button>
                        <button onClick={() => handleRejectDriver(u.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-bold hover:bg-red-200">Rejeitar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Ride Management */}
      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Viagens Recentes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passageiro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rides.slice(0, 10).map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('pt-BR') : new Date(r.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {users.find(u => u.id === r.userId)?.name || 'Passageiro'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {users.find(u => u.id === r.driverId)?.name || 'Aguardando'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(r.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={`px-2 py-1 rounded-full font-bold uppercase ${
                      r.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      r.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {r.status === 'completed' ? 'Concluída' : 
                       r.status === 'cancelled' ? 'Cancelada' : 
                       r.status === 'accepted' ? 'Aceita' :
                       r.status === 'in_progress' ? 'Em Curso' :
                       r.status === 'searching' ? 'Procurando' :
                       r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {r.status !== 'completed' && r.status !== 'cancelled' && (
                      <button 
                        onClick={async () => {
                          if (!window.confirm('Cancelar esta corrida?')) return;
                          try {
                            await rideService.cancelRide(r.id, 'Cancelado pelo administrador');
                            toast.success('Corrida cancelada pelo admin');
                          } catch (e) {
                            toast.error('Erro ao cancelar');
                          }
                        }}
                        className="text-red-600 hover:text-red-900 font-bold"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Solicitações de Saque</h3>
          <button onClick={fetchWithdrawals} className="text-sm text-blue-600 hover:underline">Atualizar</button>
        </div>
        
        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma solicitação de saque no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chave PIX</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map(w => {
                  const driver = users.find(u => u.id === w.userId);
                  return (
                    <tr key={w.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {w.createdAt?._seconds ? new Date(w.createdAt._seconds * 1000).toLocaleString('pt-BR') : w.createdAt ? new Date(w.createdAt).toLocaleString('pt-BR') : 'Data Indisponível'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {driver?.name || 'Motorista Desconhecido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(w.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {w.pixKey}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1
                          ${w.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            w.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {w.status === 'completed' && <CheckCircle size={12} />}
                          {w.status === 'rejected' && <XCircle size={12} />}
                          {w.status === 'pending' && <Clock size={12} />}
                          {w.status === 'completed' ? 'Concluído' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleProcessWithdrawal(w.id, 'complete')}
                              disabled={processingWithdrawal === w.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Aprovar
                            </button>
                            <button 
                              onClick={() => handleProcessWithdrawal(w.id, 'reject')}
                              disabled={processingWithdrawal === w.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Coupons Management */}
      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Gestão de Cupons</h3>
        
        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-lg border border-gray-200">
          <div className="md:col-span-3 font-bold text-sm text-gray-700">Criar Novo Cupom</div>
          <input 
            placeholder="CÓDIGO (ex: DESCONTO20)"
            value={newCoupon.code}
            onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
            className="p-2 border rounded-lg text-sm"
            required
          />
          <select 
            value={newCoupon.discountType}
            onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value as any})}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="percentage">Porcentagem (%)</option>
            <option value="fixed">Valor Fixo (R$)</option>
          </select>
          <input 
            type="number"
            placeholder="Valor do Desconto"
            value={newCoupon.discountValue || ''}
            onChange={e => setNewCoupon({...newCoupon, discountValue: parseFloat(e.target.value) || 0})}
            className="p-2 border rounded-lg text-sm"
            required
          />
          <input 
            type="number"
            placeholder="Limite de Uso (opcional)"
            value={newCoupon.usageLimit}
            onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value})}
            className="p-2 border rounded-lg text-sm"
          />
          <input 
            type="date"
            placeholder="Data de Expiração"
            value={newCoupon.expiryDate}
            onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
            className="p-2 border rounded-lg text-sm"
          />
          <button 
            type="submit"
            disabled={creatingCoupon}
            className="bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {creatingCoupon ? 'Criando...' : 'Criar Cupom'}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desconto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiração</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map(c => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{c.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `R$ ${c.discountValue}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {c.usageCount || 0} / {c.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {c.expiryDate ? new Date(c.expiryDate._seconds ? c.expiryDate._seconds * 1000 : c.expiryDate).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum cupom cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Support Tickets Management */}
      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Tickets de Suporte</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supportTickets.map(t => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(t.createdAt._seconds ? t.createdAt._seconds * 1000 : t.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {users.find(u => u.id === t.userId)?.name || 'Usuário'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold">{t.category}</div>
                    <div className="text-gray-500 line-clamp-1">{t.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      t.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 
                      t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {t.status === 'open' ? 'Aberto' : t.status === 'in_progress' ? 'Em Andamento' : 'Resolvido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <select 
                        value={t.status}
                        onChange={e => handleUpdateTicketStatus(t.id, e.target.value)}
                        className="p-1 border rounded text-xs"
                      >
                        <option value="open">Aberto</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="resolved">Resolvido</option>
                      </select>
                      <button 
                        onClick={() => handleOpenTicketChat(t.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Chat com usuário"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {supportTickets.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum ticket encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Support Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendAdminMessage}
        userId={auth.currentUser?.uid}
      />

      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Gestão de Tarifas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa Base (R$)</label>
            <input 
              type="number" 
              step="0.1"
              value={pricing.baseFare}
              onChange={(e) => setPricing({...pricing, baseFare: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor por Km (R$)</label>
            <input 
              type="number" 
              step="0.1"
              value={pricing.perKm}
              onChange={(e) => setPricing({...pricing, perKm: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor por Minuto (R$)</label>
            <input 
              type="number" 
              step="0.1"
              value={pricing.perMin}
              onChange={(e) => setPricing({...pricing, perMin: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Multiplicador Dinâmico</label>
            <input 
              type="number" 
              step="0.1"
              value={pricing.surgeMultiplier}
              onChange={(e) => setPricing({...pricing, surgeMultiplier: parseFloat(e.target.value) || 1.0})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input 
              type="checkbox" 
              id="surgeEnabled"
              checked={pricing.surgeEnabled}
              onChange={(e) => setPricing({...pricing, surgeEnabled: e.target.checked})}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="surgeEnabled" className="text-sm font-medium text-gray-700">
              Ativar Tarifa Dinâmica Manualmente
            </label>
          </div>
        </div>
        <button 
          onClick={handleSavePricing}
          disabled={savingPricing}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 mt-4"
        >
          {savingPricing ? 'Salvando...' : 'Salvar Tarifas'}
        </button>
      </section>

      {/* Audit Logs */}
      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Logs de Auditoria</h3>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {new Date(log.timestamp?._seconds ? log.timestamp._seconds * 1000 : log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                    {log.userEmail || log.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded-full font-bold uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum log encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Central de Notificações (Push)</h3>
        
        {/* Templates */}
        {templates.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Templates Salvos</label>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center bg-white border border-gray-300 rounded-full overflow-hidden">
                  <button 
                    onClick={() => loadTemplate(t)}
                    className="px-3 py-1 text-xs hover:bg-gray-100 transition-colors"
                  >
                    {t.name}
                  </button>
                  <button 
                    onClick={async () => {
                      if (!window.confirm('Excluir template?')) return;
                      try {
                        await userService.deleteNotificationTemplate(t.id);
                        toast.success('Template excluído');
                      } catch (e) {
                        toast.error('Erro ao excluir template');
                      }
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 border-l border-gray-300"
                  >
                    <XCircle size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Público Alvo</label>
                <select 
                  value={notifTarget} 
                  onChange={(e) => setNotifTarget(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                >
                  <option value="all">Todos os Usuários</option>
                  <option value="drivers">Apenas Motoristas Aprovados</option>
                  <option value="passengers">Apenas Passageiros</option>
                  <option value="specific">Usuário Específico</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100"
                >
                  Salvar como Template
                </button>
              </div>
            </div>

            {notifTarget === 'specific' && (
              <div className="bg-white p-4 rounded-lg border border-gray-300 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Buscar Usuário</label>
                <input 
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Nome ou email..."
                  className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-black"
                />
                {userSearchTerm && (
                  <div className="space-y-1">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setNotifTargetUserId(u.id);
                          setUserSearchTerm(u.name || u.email);
                        }}
                        className={`w-full text-left p-2 text-xs rounded hover:bg-gray-50 flex justify-between items-center ${notifTargetUserId === u.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                      >
                        <span>{u.name} ({u.email})</span>
                        {notifTargetUserId === u.id && <span className="text-blue-600 font-bold">Selecionado</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Título da Notificação</span>
                <span className="text-[10px] text-gray-400 uppercase">Dica: Use {"{{name}}"} para o nome</span>
              </label>
              <input 
                type="text" 
                required
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="Ex: Olá {{name}}, temos uma oferta!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea 
                required
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                placeholder="Ex: {{name}}, ganhe 20% de desconto..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                <input 
                  type="url" 
                  value={notifImage}
                  onChange={(e) => setNotifImage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link de Ação</label>
                <input 
                  type="url" 
                  value={notifActionUrl}
                  onChange={(e) => setNotifActionUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={sendingNotif}
              className="w-full bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {sendingNotif ? 'Processando Lote de Envio...' : 'Disparar Notificação (Prioridade Alta)'}
            </button>
          </form>

          {/* Preview do Celular */}
          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-6 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Preview (Simulado para João)</h4>
            <div className="w-72 h-[500px] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 relative overflow-hidden shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-3xl w-32 mx-auto z-20"></div>
              {/* Wallpaper */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 opacity-60"></div>
              {/* Time */}
              <div className="absolute top-12 inset-x-0 text-center text-white text-5xl font-light">09:41</div>
              
              {/* Notification Bubble */}
              <div className="absolute top-32 inset-x-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">A</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">App de Mobilidade</span>
                  <span className="text-xs text-gray-400 ml-auto">agora</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900">{notifTitle.replace(/{{name}}/g, 'João') || 'Título da Notificação'}</h4>
                <p className="text-xs text-gray-700 mt-1 line-clamp-2">{notifBody.replace(/{{name}}/g, 'João') || 'A mensagem da sua notificação aparecerá aqui.'}</p>
                {notifImage && (
                  <div className="mt-3 rounded-lg overflow-hidden h-32 bg-gray-200">
                    <img 
                      src={notifImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => e.currentTarget.style.display = 'none'} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Usuários ({users.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.name}
                    {u.isBlocked && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">Bloqueado</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleBlockUser(u.id, u.isBlocked)}
                      className={`px-3 py-1 rounded-md text-xs font-bold ${u.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-2">Últimas Corridas ({rides.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passageiro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rides.map(r => {
                const passenger = users.find(u => u.id === r.userId);
                const driver = users.find(u => u.id === r.driverId);
                return (
                  <tr key={r.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {r.createdAt?.toDate().toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {r.status === 'idle' ? 'Inativa' :
                       r.status === 'searching' ? 'Procurando' :
                       r.status === 'selecting' ? 'Selecionando' :
                       r.status === 'requesting' ? 'Solicitando' :
                       r.status === 'accepted' ? 'Aceita' :
                       r.status === 'completed' ? 'Concluída' :
                       r.status === 'cancelled' ? 'Cancelada' :
                       r.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{passenger?.name || 'Desconhecido'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver?.name || 'Nenhum'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.originName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.destName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(r.price || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Logs de Auditoria</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp?._seconds ? log.timestamp._seconds * 1000 : log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.adminName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.action === 'approve_driver' ? 'bg-green-100 text-green-800' : 
                        log.action === 'reject_driver' ? 'bg-red-100 text-red-800' : 
                        log.action === 'block_user' ? 'bg-red-100 text-red-800' : 
                        log.action === 'unblock_user' ? 'bg-green-100 text-green-800' :
                        log.action === 'send_notification' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'}`}>
                      {log.action === 'approve_driver' ? 'Aprovar Motorista' : 
                       log.action === 'reject_driver' ? 'Rejeitar Motorista' : 
                       log.action === 'block_user' ? 'Bloquear Usuário' : 
                       log.action === 'unblock_user' ? 'Desbloquear Usuário' :
                       log.action === 'send_notification' ? 'Enviar Notificação' :
                       log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{log.details}</div>
                    {log.metadata && log.action === 'send_notification' && (
                      <div className="mt-1 text-[10px] text-gray-400 flex gap-2">
                        <span>Sucesso: {log.metadata.successCount}</span>
                        <span>Falha: {log.metadata.failureCount}</span>
                        <span>Total: {log.metadata.totalTargeted}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum log encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
