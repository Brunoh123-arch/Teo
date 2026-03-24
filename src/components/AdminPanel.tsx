import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, FlatList } from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Skeleton } from './Skeleton';
import { userService } from '../services/userService';
import { CheckCircle, XCircle, Clock, BarChart3, TrendingUp, Users, MessageSquare, Banknote, Map as MapIcon, UserX, UserCheck } from 'lucide-react-native';
import { ChatModal } from './ChatModal';
import { rideService } from '../services/rideService';
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
      Alert.alert("Erro", "Erro ao carregar mensagens");
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

  const handleSendAdminMessage = async () => {
    if (!newMessage.trim() || !activeTicketId) return;

    const text = newMessage;
    setNewMessage('');
    try {
      const sentMsg = await rideService.sendAdminSupportTicketMessage(activeTicketId, text);
      setChatMessages(prev => [...prev, sentMsg]);
    } catch (error) {
      Alert.alert("Erro", "Erro ao enviar mensagem");
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

  if (loading) return <View style={styles.loadingContainer}><Skeleton /><Skeleton /></View>;

  const pendingDrivers = users.filter(u => u.driverStatus === 'pending');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Painel Administrativo</Text>
      
      {/* Dashboard Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconWrapper}><Users size={24} color="white" /></View>
            <Text style={styles.statTitle}>Total Usuários</Text>
          </View>
          <Text style={styles.statValue}>{users.length}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconWrapper}><BarChart3 size={24} color="white" /></View>
            <Text style={styles.statTitle}>Viagens Totais</Text>
          </View>
          <Text style={styles.statValue}>{rides.length}</Text>
        </View>
        {/* ... */}
      </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconWrapper}><TrendingUp size={24} color="white" /></View>
            <Text style={styles.statTitle}>Receita Total</Text>
          </View>
          <Text style={styles.statValue}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rides.reduce((acc, r) => acc + (r.price || 0), 0))}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconWrapper}><Banknote size={24} color="white" /></View>
            <Text style={styles.statTitle}>Comissão (15%)</Text>
          </View>
          <Text style={styles.statValue}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rides.reduce((acc, r) => acc + (r.price || 0), 0) * 0.15)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconWrapper}><UserCheck size={24} color="white" /></View>
            <Text style={styles.statTitle}>Motoristas Online</Text>
          </View>
          <Text style={styles.statValue}>{users.filter(u => u.isOnline).length}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconWrapper}><Clock size={24} color="white" /></View>
            <Text style={styles.statTitle}>Corridas Ativas</Text>
          </View>
          <Text style={styles.statValue}>{rides.filter(r => ['accepted', 'arrived', 'in_progress'].includes(r.status)).length}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconWrapper}><MapIcon size={24} color="white" /></View>
            <Text style={styles.statTitle}>Mapa de Calor</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowHeatmap?.(!showHeatmap)}
            style={[styles.button, showHeatmap ? styles.activeButton : styles.inactiveButton]}
          >
            <Text style={[styles.buttonText, showHeatmap ? styles.activeButtonText : styles.inactiveButtonText]}>
              {showHeatmap ? 'Desativar Heatmap' : 'Ativar Heatmap'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Charts */}
      <View style={styles.chartsContainer}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Viagens por Dia (Últimos 7 dias)</Text>
          {/* Recharts needs to be replaced with a React Native charting library */}
          <Text style={styles.placeholderText}>Gráfico indisponível em React Native</Text>
        </View>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Receita por Dia (R$)</Text>
          {/* Recharts needs to be replaced with a React Native charting library */}
          <Text style={styles.placeholderText}>Gráfico indisponível em React Native</Text>
        </View>
      </View>
      
      {/* User Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gestão de Usuários</Text>
          <TextInput 
            placeholder="Buscar usuário..." 
            value={userSearchTerm}
            onChangeText={setUserSearchTerm}
            style={styles.searchInput}
          />
        </View>
        <FlatList
          data={users.filter(u => 
            u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
          ).slice(0, 10)}
          keyExtractor={u => u.id}
          renderItem={({ item: u }) => (
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                <Image source={{ uri: u.photoURL || `https://i.pravatar.cc/150?u=${u.id}` }} style={styles.userPhoto} />
                <View>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                </View>
              </View>
              <Text style={[styles.userType, u.driverStatus === 'approved' ? styles.driverType : styles.passengerType]}>
                {u.driverStatus === 'approved' ? 'Motorista' : 'Passageiro'}
              </Text>
              <Text style={[styles.userStatus, u.isBlocked ? styles.blockedStatus : styles.activeStatus]}>
                {u.isBlocked ? 'Bloqueado' : 'Ativo'}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity 
                  onPress={() => handleToggleBlockUser(u.id, u.isBlocked)}
                  style={[styles.actionButton, u.isBlocked ? styles.unblockButton : styles.blockButton]}
                >
                  {u.isBlocked ? <UserCheck size={18} color="green" /> : <UserX size={18} color="red" />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageSquare size={18} color="blue" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {pendingDrivers.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.pendingDriversTitle]}>Motoristas Pendentes ({pendingDrivers.length})</Text>
          <FlatList
            data={pendingDrivers}
            keyExtractor={u => u.id}
            renderItem={({ item: u }) => {
              const userDocs = documents.find(d => d.userId === u.id);
              return (
                <View style={styles.driverRow}>
                  <Text style={styles.driverName}>{u.name}</Text>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleText}><Text style={styles.bold}>CNH:</Text> {u.driverData?.cnh || u.cnh || 'Não informado'}</Text>
                    <Text style={styles.vehicleText}><Text style={styles.bold}>Placa:</Text> {u.driverData?.vehicle?.plate || u.driverData?.plate || u.vehicle?.plate || 'Não informado'}</Text>
                    <Text style={styles.vehicleText}><Text style={styles.bold}>Modelo:</Text> {u.driverData?.vehicle?.model || u.driverData?.model || u.vehicle?.model || 'Não informado'}</Text>
                    <Text style={styles.vehicleText}><Text style={styles.bold}>Cor:</Text> {u.driverData?.vehicle?.color || u.driverData?.color || u.vehicle?.color || 'Não informado'}</Text>
                    <Text style={styles.vehicleText}><Text style={styles.bold}>Ano:</Text> {u.driverData?.vehicle?.year || u.driverData?.year || u.vehicle?.year || 'Não informado'}</Text>
                  </View>
                  <View style={styles.documentLinks}>
                    {userDocs?.cnhUrl ? (
                      <TouchableOpacity onPress={() => Linking.openURL(userDocs.cnhUrl)}><Text style={styles.link}>Ver CNH</Text></TouchableOpacity>
                    ) : (
                      <Text style={styles.errorText}>Sem CNH</Text>
                    )}
                    {userDocs?.crlvUrl ? (
                      <TouchableOpacity onPress={() => Linking.openURL(userDocs.crlvUrl)}><Text style={styles.link}>Ver CRLV</Text></TouchableOpacity>
                    ) : (
                      <Text style={styles.errorText}>Sem CRLV</Text>
                    )}
                    {userDocs?.selfieUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(userDocs.selfieUrl)}><Text style={styles.link}>Ver Selfie</Text></TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleApproveDriver(u.id)} style={styles.approveButton}><Text style={styles.buttonText}>Aprovar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRejectDriver(u.id)} style={styles.rejectButton}><Text style={styles.buttonText}>Rejeitar</Text></TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* Ride Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Viagens Recentes</Text>
        <FlatList
          data={rides.slice(0, 10)}
          keyExtractor={r => r.id}
          renderItem={({ item: r }) => (
            <View style={styles.rideRow}>
              <Text style={styles.rideDate}>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('pt-BR') : new Date(r.createdAt).toLocaleString('pt-BR')}</Text>
              <Text style={styles.ridePassenger}>{users.find(u => u.id === r.userId)?.name || 'Passageiro'}</Text>
              <Text style={styles.rideDriver}>{users.find(u => u.id === r.driverId)?.name || 'Aguardando'}</Text>
              <Text style={styles.ridePrice}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(r.price)}</Text>
              <Text style={[styles.rideStatus, r.status === 'completed' ? styles.completedStatus : r.status === 'cancelled' ? styles.cancelledStatus : styles.activeStatus]}>
                {r.status === 'completed' ? 'Concluída' : 
                 r.status === 'cancelled' ? 'Cancelada' : 
                 r.status === 'accepted' ? 'Aceita' :
                 r.status === 'in_progress' ? 'Em Curso' :
                 r.status === 'searching' ? 'Procurando' :
                 r.status}
              </Text>
              {r.status !== 'completed' && r.status !== 'cancelled' && (
                <TouchableOpacity 
                  onPress={async () => {
                    Alert.alert('Cancelar', 'Cancelar esta corrida?', [
                      { text: 'Não' },
                      { text: 'Sim', onPress: async () => {
                        try {
                          await rideService.cancelRide(r.id, 'Cancelado pelo administrador');
                          Alert.alert('Sucesso', 'Corrida cancelada pelo admin');
                        } catch (e) {
                          Alert.alert('Erro', 'Erro ao cancelar');
                        }
                      }}
                    ]);
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Solicitações de Saque</Text>
          <TouchableOpacity onPress={fetchWithdrawals}><Text style={styles.link}>Atualizar</Text></TouchableOpacity>
        </View>
        
        {withdrawals.length === 0 ? (
          <Text style={styles.placeholderText}>Nenhuma solicitação de saque no momento.</Text>
        ) : (
          <FlatList
            data={withdrawals}
            keyExtractor={w => w.id}
            renderItem={({ item: w }) => {
              const driver = users.find(u => u.id === w.userId);
              return (
                <View style={styles.withdrawalRow}>
                  <Text style={styles.withdrawalDate}>{w.createdAt?._seconds ? new Date(w.createdAt._seconds * 1000).toLocaleString('pt-BR') : w.createdAt ? new Date(w.createdAt).toLocaleString('pt-BR') : 'Data Indisponível'}</Text>
                  <Text style={styles.withdrawalDriver}>{driver?.name || 'Motorista Desconhecido'}</Text>
                  <Text style={styles.withdrawalAmount}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(w.amount)}</Text>
                  <Text style={styles.withdrawalPix}>{w.pixKey}</Text>
                  <Text style={[styles.withdrawalStatus, w.status === 'completed' ? styles.completedStatus : w.status === 'rejected' ? styles.rejectedStatus : styles.pendingStatus]}>
                    {w.status === 'completed' ? 'Concluído' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </Text>
                  {w.status === 'pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity 
                        onPress={() => handleProcessWithdrawal(w.id, 'complete')}
                        disabled={processingWithdrawal === w.id}
                        style={styles.approveButton}
                      >
                        <Text style={styles.buttonText}>Aprovar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleProcessWithdrawal(w.id, 'reject')}
                        disabled={processingWithdrawal === w.id}
                        style={styles.rejectButton}
                      >
                        <Text style={styles.buttonText}>Rejeitar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Coupons Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestão de Cupons</Text>
        
        <View style={styles.couponForm}>
          <Text style={styles.formTitle}>Criar Novo Cupom</Text>
          <TextInput 
            placeholder="CÓDIGO (ex: DESCONTO20)"
            value={newCoupon.code}
            onChangeText={code => setNewCoupon({...newCoupon, code: code.toUpperCase()})}
            style={styles.input}
          />
          <TextInput 
            placeholder="Valor do Desconto"
            value={newCoupon.discountValue.toString()}
            onChangeText={value => setNewCoupon({...newCoupon, discountValue: parseFloat(value) || 0})}
            style={styles.input}
            keyboardType="numeric"
          />
          <TouchableOpacity 
            onPress={handleCreateCoupon}
            disabled={creatingCoupon}
            style={styles.createButton}
          >
            <Text style={styles.buttonText}>{creatingCoupon ? 'Criando...' : 'Criar Cupom'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={coupons}
          keyExtractor={c => c.id}
          renderItem={({ item: c }) => (
            <View style={styles.couponRow}>
              <Text style={styles.couponCode}>{c.id}</Text>
              <TouchableOpacity onPress={() => handleDeleteCoupon(c.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      </section>

      {/* Support Tickets Management */}
      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Tickets de Suporte</h3>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Data</Text>
          <Text style={styles.headerText}>Usuário</Text>
          <Text style={styles.headerText}>Assunto</Text>
          <Text style={styles.headerText}>Status</Text>
          <Text style={styles.headerText}>Ações</Text>
        </View>
        <FlatList
          data={supportTickets}
          keyExtractor={t => t.id}
          renderItem={({ item: t }) => (
            <View style={styles.ticketRow}>
              <Text style={styles.ticketDate}>{new Date(t.createdAt._seconds ? t.createdAt._seconds * 1000 : t.createdAt).toLocaleString('pt-BR')}</Text>
              <Text style={styles.ticketUser}>{users.find(u => u.id === t.userId)?.name || 'Usuário'}</Text>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketCategory}>{t.category}</Text>
                <Text style={styles.ticketSubject} numberOfLines={1}>{t.subject}</Text>
              </View>
              <Text style={[styles.ticketStatus, t.status === 'open' ? styles.openStatus : t.status === 'in_progress' ? styles.inProgressStatus : styles.resolvedStatus]}>
                {t.status === 'open' ? 'Aberto' : t.status === 'in_progress' ? 'Em Andamento' : 'Resolvido'}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleOpenTicketChat(t.id)} style={styles.chatButton}>
                  <Text style={styles.buttonText}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestão de Tarifas</Text>
        <View style={styles.gridContainer}>
          <View>
            <Text style={styles.label}>Tarifa Base (R$)</Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={pricing.baseFare.toString()}
              onChangeText={(text) => setPricing({...pricing, baseFare: parseFloat(text) || 0})}
            />
          </View>
          <View>
            <Text style={styles.label}>Valor por Km (R$)</Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={pricing.perKm.toString()}
              onChangeText={(text) => setPricing({...pricing, perKm: parseFloat(text) || 0})}
            />
          </View>
          <View>
            <Text style={styles.label}>Valor por Minuto (R$)</Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={pricing.perMin.toString()}
              onChangeText={(text) => setPricing({...pricing, perMin: parseFloat(text) || 0})}
            />
          </View>
          <View>
            <Text style={styles.label}>Multiplicador Dinâmico</Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={pricing.surgeMultiplier.toString()}
              onChangeText={(text) => setPricing({...pricing, surgeMultiplier: parseFloat(text) || 1.0})}
            />
          </View>
          <View style={styles.flexRow}>
            <TouchableOpacity 
              onPress={() => setPricing({...pricing, surgeEnabled: !pricing.surgeEnabled})}
              style={[styles.checkbox, pricing.surgeEnabled && styles.checkboxChecked]}
            >
              {pricing.surgeEnabled && <Text style={styles.checkboxText}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.label}>
              Ativar Tarifa Dinâmica Manualmente
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={handleSavePricing}
          disabled={savingPricing}
          style={[styles.button, savingPricing && styles.disabledButton]}
        >
          <Text style={styles.buttonText}>{savingPricing ? 'Salvando...' : 'Salvar Tarifas'}</Text>
        </TouchableOpacity>
      </section>

      {/* Audit Logs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs de Auditoria</Text>
        <FlatList
          data={auditLogs}
          keyExtractor={(log, idx) => idx.toString()}
          renderItem={({ item: log }) => (
            <View style={styles.logRow}>
              <Text style={styles.logDate}>{new Date(log.timestamp?._seconds ? log.timestamp._seconds * 1000 : log.timestamp).toLocaleString('pt-BR')}</Text>
              <Text style={styles.logUser}>{log.userEmail || log.userId}</Text>
              <Text style={styles.logAction}>{log.action}</Text>
              <Text style={styles.logDetails}>{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>Data</Text>
              <Text style={styles.headerText}>Usuário</Text>
              <Text style={styles.headerText}>Ação</Text>
              <Text style={styles.headerText}>Detalhes</Text>
            </View>
          )}
          ListEmptyComponent={() => <Text style={styles.placeholderText}>Nenhum log encontrado.</Text>}
        />
      </section>

      <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Central de Notificações (Push)</h3>
        
        {/* Templates */}
        {templates.length > 0 && (
          <View style={styles.marginBottom}>
            <Text style={styles.label}>Templates Salvos</Text>
            <View style={styles.flexWrap}>
              {templates.map(t => (
                <View key={t.id} style={styles.templateItem}>
                  <TouchableOpacity 
                    onPress={() => loadTemplate(t)}
                    style={styles.templateButton}
                  >
                    <Text style={styles.templateText}>{t.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={async () => {
                      // Alert replacement for window.confirm
                      Alert.alert('Excluir', 'Excluir template?', [
                        { text: 'Cancelar' },
                        { text: 'Excluir', onPress: async () => {
                          try {
                            await userService.deleteNotificationTemplate(t.id);
                            // toast.success('Template excluído'); // Need to handle toast
                          } catch (e) {
                            // toast.error('Erro ao excluir template');
                          }
                        }}
                      ]);
                    }}
                    style={styles.deleteButton}
                  >
                    <XCircle size={12} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.gridContainer}>
          {/* Formulário */}
          <View style={styles.formContainer}>
            <View style={styles.flexRow}>
              <View style={styles.flexOne}>
                <Text style={styles.label}>Público Alvo</Text>
                {/* Select replacement needed */}
                <TouchableOpacity 
                  onPress={() => { /* Need to implement picker logic */ }}
                  style={styles.input}
                >
                  <Text>{notifTarget}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.flexItemsEnd}>
                <TouchableOpacity 
                  onPress={handleSaveTemplate}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Salvar como Template</Text>
                </TouchableOpacity>
              </View>
            </View>

            {notifTarget === 'specific' && (
              <View style={styles.searchContainer}>
                <Text style={styles.label}>Buscar Usuário</Text>
                <TextInput 
                  style={styles.input}
                  value={userSearchTerm}
                  onChangeText={setUserSearchTerm}
                  placeholder="Nome ou email..."
                />
                {userSearchTerm && (
                  <View style={styles.userList}>
                    {filteredUsers.map(u => (
                      <TouchableOpacity
                        key={u.id}
                        onPress={() => {
                          setNotifTargetUserId(u.id);
                          setUserSearchTerm(u.name || u.email);
                        }}
                        style={[styles.userItem, notifTargetUserId === u.id && styles.selectedUser]}
                      >
                        <Text style={styles.userText}>{u.name} ({u.email})</Text>
                        {notifTargetUserId === u.id && <Text style={styles.selectedText}>Selecionado</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View>
              <Text style={styles.label}>Título da Notificação</Text>
              <TextInput 
                style={styles.input}
                value={notifTitle}
                onChangeText={setNotifTitle}
                placeholder="Ex: Olá {{name}}, temos uma oferta!"
              />
            </View>
            <View>
              <Text style={styles.label}>Mensagem</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                value={notifBody}
                onChangeText={setNotifBody}
                placeholder="Ex: {{name}}, ganhe 20% de desconto..."
                multiline
              />
            </View>
            <View style={styles.gridContainer}>
              <View>
                <Text style={styles.label}>URL da Imagem</Text>
                <TextInput 
                  style={styles.input}
                  value={notifImage}
                  onChangeText={setNotifImage}
                  placeholder="https://..."
                />
              </View>
              <View>
                <Text style={styles.label}>Link de Ação</Text>
                <TextInput 
                  style={styles.input}
                  value={notifActionUrl}
                  onChangeText={setNotifActionUrl}
                  placeholder="https://..."
                />
              </View>
            </div>
            <TouchableOpacity 
              onPress={handleSendNotification}
              disabled={sendingNotif}
              style={[styles.button, sendingNotif && styles.disabledButton]}
            >
              <Text style={styles.buttonText}>{sendingNotif ? 'Processando Lote de Envio...' : 'Disparar Notificação (Prioridade Alta)'}</Text>
            </TouchableOpacity>
          </form>

          {/* Preview do Celular */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview (Simulado para João)</Text>
            <View style={styles.phoneFrame}>
              {/* Notch */}
              <View style={styles.notch}></View>
              {/* Wallpaper */}
              <View style={styles.wallpaper}></View>
              {/* Time */}
              <Text style={styles.timeText}>09:41</Text>
              
              {/* Notification Bubble */}
              <View style={styles.notificationBubble}>
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    <Text style={styles.iconText}>A</Text>
                  </View>
                  <Text style={styles.notificationAppName}>App de Mobilidade</Text>
                  <Text style={styles.notificationTime}>agora</Text>
                </View>
                <Text style={styles.notificationTitle}>{notifTitle.replace(/{{name}}/g, 'João') || 'Título da Notificação'}</Text>
                <Text style={styles.notificationBody}>{notifBody.replace(/{{name}}/g, 'João') || 'A mensagem da sua notificação aparecerá aqui.'}</Text>
                {notifImage && (
                  <View style={styles.imagePreview}>
                    <Image 
                      source={{ uri: notifImage }} 
                      style={styles.image}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Usuários ({users.length})</h3>
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={({ item: u }) => (
            <View style={styles.userRow}>
              <Text style={styles.userName}>
                {u.name}
                {u.isBlocked && <Text style={styles.blockedBadge}>Bloqueado</Text>}
              </Text>
              <Text style={styles.userEmail}>{u.email}</Text>
              <TouchableOpacity 
                onPress={() => handleToggleBlockUser(u.id, u.isBlocked)}
                style={[styles.actionButton, u.isBlocked ? styles.unblockButton : styles.blockButton]}
              >
                <Text style={styles.buttonText}>{u.isBlocked ? 'Desbloquear' : 'Bloquear'}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>Nome</Text>
              <Text style={styles.headerText}>Email</Text>
              <Text style={styles.headerText}>Ações</Text>
            </View>
          )}
        />
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-2">Últimas Corridas ({rides.length})</h3>
        <FlatList
          data={rides}
          keyExtractor={r => r.id}
          renderItem={({ item: r }) => {
            const passenger = users.find(u => u.id === r.userId);
            const driver = users.find(u => u.id === r.driverId);
            return (
              <View style={styles.rideRow}>
                <Text style={styles.rideDate}>{r.createdAt?.toDate().toLocaleDateString('pt-BR')}</Text>
                <Text style={styles.rideStatus}>{r.status}</Text>
                <Text style={styles.ridePassenger}>{passenger?.name || 'Desconhecido'}</Text>
                <Text style={styles.rideDriver}>{driver?.name || 'Nenhum'}</Text>
                <Text style={styles.rideOrigin}>{r.originName || 'N/A'}</Text>
                <Text style={styles.rideDest}>{r.destName}</Text>
                <Text style={styles.ridePrice}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(r.price || 0)}</Text>
              </View>
            );
          }}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>Data</Text>
              <Text style={styles.headerText}>Status</Text>
              <Text style={styles.headerText}>Passageiro</Text>
              <Text style={styles.headerText}>Motorista</Text>
              <Text style={styles.headerText}>Origem</Text>
              <Text style={styles.headerText}>Destino</Text>
              <Text style={styles.headerText}>Preço</Text>
            </View>
          )}
        />
      </section>

      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Logs de Auditoria</h3>
        <FlatList
          data={auditLogs}
          keyExtractor={log => log.id}
          renderItem={({ item: log }) => (
            <View style={styles.logRow}>
              <Text style={styles.logDate}>{new Date(log.timestamp?._seconds ? log.timestamp._seconds * 1000 : log.timestamp).toLocaleString('pt-BR')}</Text>
              <Text style={styles.logAdmin}>{log.adminName}</Text>
              <Text style={[styles.logAction, { backgroundColor: log.action === 'approve_driver' ? '#dcfce7' : '#fee2e2' }]}>{log.action}</Text>
              <Text style={styles.logDetails}>{log.details}</Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>Data</Text>
              <Text style={styles.headerText}>Admin</Text>
              <Text style={styles.headerText}>Ação</Text>
              <Text style={styles.headerText}>Detalhes</Text>
            </View>
          )}
          ListEmptyComponent={() => <Text style={styles.placeholderText}>Nenhum log encontrado.</Text>}
        />
      </section>
      </ScrollView>
    </div>
  );
};
