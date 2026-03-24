import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Navigation } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  newMessage: string;
  setNewMessage: (text: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  userId: string | undefined;
  otherUserName?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  userId,
  otherUserName = "Chat",
}) => {
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
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full h-[70vh] rounded-t-3xl flex flex-col relative z-10 shadow-2xl border-t border-white/50"
          >
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20 rounded-t-3xl">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <h3 className="font-bold text-lg text-[var(--system-label)]">{otherUserName}</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Nenhuma mensagem ainda.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? "bg-blue-600 text-white self-end rounded-tr-none" : "bg-white border border-gray-200 text-gray-900 self-start rounded-tl-none shadow-sm"}`}
                    >
                      {msg.text}
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={onSendMessage}
              className="p-4 border-t bg-white flex gap-2 items-center"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none text-gray-900"
                placeholder="Digite uma mensagem..."
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white p-3 rounded-full flex items-center justify-center disabled:bg-gray-300 transition-colors"
              >
                <Navigation className="w-5 h-5 transform rotate-90" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
