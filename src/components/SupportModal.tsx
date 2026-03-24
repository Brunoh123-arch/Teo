import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { X, MessageSquare, Send, Clock, HelpCircle, MessageCircle, Plus } from 'lucide-react';
import { rideService } from '../services/rideService';
import { auth } from '../firebase';
import { ChatModal } from './ChatModal';
import { socketService } from '../services/socketService';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

export const SupportModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'ride' | 'payment' | 'account' | 'other'>('ride');
  const [submitting, setSubmitting] = useState(false);

  // Support Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
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

  const handleOpenTicketChat = async (ticketId: string) => {
    setActiveTicketId(ticketId);
    setIsChatOpen(true);
    socketService.joinSupportTicket(ticketId);
    try {
      const messages = await rideService.getSupportTicketMessages(ticketId);
      setChatMessages(messages);
    } catch (error) {
      Alert.alert("Erro", "Erro ao carregar mensagens");
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicketId) return;

    const text = newMessage;
    setNewMessage('');
    try {
      const sentMsg = await rideService.sendSupportTicketMessage(activeTicketId, text);
      setChatMessages(prev => [...prev, sentMsg]);
    } catch (error) {
      Alert.alert("Erro", "Erro ao enviar mensagem");
      setNewMessage(text);
    }
  };

  const fetchTickets = async () => {
    try {
      const data = await rideService.getSupportTickets();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (subject.length < 3 || message.length < 10) {
      Alert.alert("Erro", "Por favor, preencha o assunto e a mensagem detalhadamente.");
      return;
    }

    setSubmitting(true);
    triggerHaptic(ImpactFeedbackStyle.Medium);
    try {
      await rideService.createSupportTicket({ subject, message, category });
      Alert.alert("Sucesso", "Ticket de suporte criado com sucesso!");
      setShowNewTicket(false);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (error) {
      Alert.alert("Erro", "Erro ao criar ticket de suporte.");
    } finally {
      setSubmitting(false);
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
            <Text style={styles.headerTitle}>Suporte e Ajuda</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {showNewTicket ? (
            <View style={styles.formContainer}>
              <TouchableOpacity 
                onPress={() => setShowNewTicket(false)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={styles.formTitle}>Novo Chamado</Text>

              <Text style={styles.label}>CATEGORIA</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    // Simple toggle for demo purposes, or could open a modal
                    const categories = ['ride', 'payment', 'account', 'other'] as const;
                    const nextIndex = (categories.indexOf(category) + 1) % categories.length;
                    setCategory(categories[nextIndex]);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {category === 'ride' && "Problema com Corrida"}
                    {category === 'payment' && "Pagamento / Cobrança"}
                    {category === 'account' && "Minha Conta"}
                    {category === 'other' && "Outros Assuntos"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>ASSUNTO</Text>
              <TextInput 
                value={subject}
                onChangeText={setSubject}
                placeholder="Resumo do problema"
                style={styles.input}
              />

              <Text style={styles.label}>MENSAGEM</Text>
              <TextInput 
                value={message}
                onChangeText={setMessage}
                placeholder="Descreva o que aconteceu em detalhes..."
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
              />

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>{submitting ? 'Enviando...' : 'Enviar Mensagem'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <TouchableOpacity
                onPress={() => { triggerHaptic(); setShowNewTicket(true); }}
                style={styles.newTicketButton}
              >
                <View style={styles.newTicketButtonContent}>
                  <HelpCircle size={24} color="#1d4ed8" />
                  <Text style={styles.newTicketButtonText}>Precisa de ajuda?</Text>
                </View>
                <Plus size={20} color="#1d4ed8" />
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>
                <Clock size={20} color="#6b7280" /> Seus Chamados
              </Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text>Carregando...</Text>
                </View>
              ) : tickets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MessageSquare size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>Você ainda não tem chamados abertos.</Text>
                </View>
              ) : (
                <View style={styles.ticketsList}>
                  {tickets.map((ticket) => (
                    <TouchableOpacity 
                      key={ticket.id} 
                      style={styles.ticketItem}
                      onPress={() => handleOpenTicketChat(ticket.id)}
                    >
                      <View style={styles.ticketHeader}>
                        <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                        <View style={[styles.statusBadge, ticket.status === 'open' ? styles.statusOpen : ticket.status === 'in_progress' ? styles.statusInProgress : styles.statusResolved]}>
                          <Text style={styles.statusText}>
                            {ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em análise' : 'Resolvido'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ticketMessage} numberOfLines={2}>{ticket.message}</Text>
                      <Text style={styles.ticketDate}>
                        {new Date(ticket.createdAt?._seconds * 1000 || ticket.createdAt).toLocaleString('pt-BR')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={handleSendMessage}
          userId={auth.currentUser?.uid}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  formContainer: {
    gap: 12,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  pickerButton: {
    padding: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    gap: 24,
  },
  newTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  newTicketButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newTicketButtonText: {
    color: '#1d4ed8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 12,
  },
  ticketsList: {
    gap: 12,
  },
  ticketItem: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketSubject: {
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: '#dbeafe',
  },
  statusInProgress: {
    backgroundColor: '#fef3c7',
  },
  statusResolved: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  ticketDate: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
