import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Send, Clock, HelpCircle, MessageCircle } from 'lucide-react';
import { rideService } from '../services/rideService';
import { auth } from '../firebase';
import { ChatModal } from './ChatModal';
import { socketService } from '../services/socketService';
import { toast } from 'sonner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

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

  const handleOpenTicketChat = async (ticketId: string) => {
    setActiveTicketId(ticketId);
    setIsChatOpen(true);
    socketService.joinSupportTicket(ticketId);
    try {
      const messages = await rideService.getSupportTicketMessages(ticketId);
      setChatMessages(messages);
    } catch (error) {
      toast.error("Erro ao carregar mensagens");
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicketId) return;

    const text = newMessage;
    setNewMessage('');
    try {
      const sentMsg = await rideService.sendSupportTicketMessage(activeTicketId, text);
      setChatMessages(prev => [...prev, sentMsg]);
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      setNewMessage(text);
    }
  };

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('Haptics not available', e);
      }
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

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.length < 3 || message.length < 10) {
      toast.error("Por favor, preencha o assunto e a mensagem detalhadamente.");
      return;
    }

    setSubmitting(true);
    triggerHaptic(ImpactStyle.Medium);
    try {
      await rideService.createSupportTicket({ subject, message, category });
      toast.success("Ticket de suporte criado com sucesso!");
      setShowNewTicket(false);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (error) {
      toast.error("Erro ao criar ticket de suporte.");
    } finally {
      setSubmitting(false);
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
                <h3 className="font-bold text-lg text-[var(--system-label)]">Suporte e Ajuda</h3>
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
              {showNewTicket ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      type="button"
                      onClick={() => setShowNewTicket(false)}
                      className="text-blue-600 font-bold text-sm"
                    >
                      ← Voltar
                    </button>
                    <h4 className="font-bold text-gray-900">Novo Chamado</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Categoria</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none bg-white"
                    >
                      <option value="ride">Problema com Corrida</option>
                      <option value="payment">Pagamento / Cobrança</option>
                      <option value="account">Minha Conta</option>
                      <option value="other">Outros Assuntos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Assunto</label>
                    <input 
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Resumo do problema"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mensagem</label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva o que aconteceu em detalhes..."
                      rows={4}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Enviando...' : 'Enviar Mensagem'}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <button
                    onClick={() => { triggerHaptic(); setShowNewTicket(true); }}
                    className="w-full bg-blue-50 text-blue-700 p-4 rounded-2xl font-bold flex items-center justify-between border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-6 h-6" />
                      <span>Precisa de ajuda?</span>
                    </div>
                    <Plus className="w-5 h-5" />
                  </button>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      Seus Chamados
                    </h4>
                    
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Você ainda não tem chamados abertos.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tickets.map((ticket) => (
                          <div 
                            key={ticket.id} 
                            className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => handleOpenTicketChat(ticket.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-gray-900">{ticket.subject}</h5>
                              <div className="flex items-center gap-2">
                                <MessageCircle size={14} className="text-blue-600" />
                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                                  ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em análise' : 'Resolvido'}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.message}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(ticket.createdAt?._seconds * 1000 || ticket.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          <ChatModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={handleSendMessage}
            userId={auth.currentUser?.uid}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
