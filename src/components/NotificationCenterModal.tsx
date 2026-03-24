import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Info, AlertTriangle, CheckCircle, Clock, Trash2, Gift, ShieldCheck, ExternalLink, Check } from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promo';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <AlertTriangle className="text-red-500" size={20} />;
      case 'promo': return <Gift className="text-purple-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2100] flex flex-col justify-end pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full h-[85vh] rounded-t-3xl flex flex-col relative z-10 shadow-2xl overflow-hidden border-t border-white/50"
          >
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20 rounded-t-3xl">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg text-[var(--system-label)]">Notificações</h3>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={onMarkAllAsRead}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1"
                      >
                        Ler todas
                      </button>
                      <button
                        onClick={onClearAll}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                        title="Limpar tudo"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bell size={40} className="text-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Tudo limpo por aqui!</h4>
                    <p className="text-sm text-gray-500">Você não tem novas notificações.</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-2xl border flex gap-4 transition-all shadow-sm relative overflow-hidden ${
                      notif.read ? 'bg-white border-gray-100 opacity-80' : 'bg-white border-blue-100 ring-1 ring-blue-50'
                    }`}
                  >
                    {!notif.read && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    )}
                    <div className="mt-1 shrink-0">{getIcon(notif.type)}</div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-sm truncate ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                          <Clock size={10} />
                          {formatTime(notif.timestamp)}
                        </div>
                      </div>
                      <p className={`text-xs leading-relaxed ${notif.read ? 'text-gray-500' : 'text-gray-600'}`}>
                        {notif.body}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-3">
                          {!notif.read && (
                            <button 
                              onClick={() => onMarkAsRead(notif.id)}
                              className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                            >
                              <Check className="w-3 h-3" />
                              Marcar como lida
                            </button>
                          )}
                          {notif.actionUrl && (
                            <a 
                              href={notif.actionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-gray-900 flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver mais
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
