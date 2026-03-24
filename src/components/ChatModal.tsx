import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Send } from 'lucide-react';

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
  onSendMessage: () => void;
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
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (isOpen) {
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

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={onClose}
      />
      <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>{otherUserName}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma mensagem ainda.</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === userId;
                return (
                  <View
                    key={msg.id}
                    style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}
                  >
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                      {msg.text}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              style={styles.input}
              placeholder="Digite uma mensagem..."
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              onPress={onSendMessage}
              disabled={!newMessage.trim()}
              style={[styles.sendButton, !newMessage.trim() && styles.disabledButton]}
            >
              <Send size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    height: '70%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  container: {
    flex: 1,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#111827',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
});
