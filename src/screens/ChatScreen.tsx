import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import websocketService, { Message as WSMessage, TypingEvent, MessageReadEvent } from '../services/websocket';
import ChatInvitationModal from '../components/ChatInvitationModal';
import InvitationNotification from '../components/InvitationNotification';

// Use the Message interface from WebSocket service
type Message = WSMessage;

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentInvitation, setCurrentInvitation] = useState<any>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'received' | 'accepted' | 'rejected' | 'sent';
    senderName?: string;
    recipientName?: string;
    message?: string;
  }>({ visible: false, type: 'received' });
  const flatListRef = useRef<FlatList>(null);
  const inputScale = useSharedValue(1);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInitialData();
    return () => {
      // Cleanup on unmount
      if (partner) {
        websocketService.leaveRoom(partner.id);
      }
      websocketService.off('new_message', handleNewMessage);
      websocketService.off('user_typing', handleUserTyping);
      websocketService.off('message_read', handleMessageRead);
      websocketService.off('error', handleWebSocketError);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('chat_invitation_received', handleChatInvitationReceived);
      websocketService.off('chat_invitation_accepted', handleChatInvitationAccepted);
      websocketService.off('chat_invitation_rejected', handleChatInvitationRejected);
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Setup WebSocket connection when partner is selected
    if (partner && user) {
      setupWebSocketConnection();
    }
  }, [partner, user]);

  // WebSocket event handlers
  const handleNewMessage = useCallback((message: Message) => {
    console.log('Received new message:', message);
    setMessages(prev => {
      // Avoid duplicates
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  const handleUserTyping = useCallback((data: TypingEvent) => {
    if (data.userId === partner?.id) {
      setPartnerTyping(data.isTyping);

      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setPartnerTyping(false);
        }, 3000);
      }
    }
  }, [partner?.id]);

  const handleMessageRead = useCallback((data: MessageReadEvent) => {
    setMessages(prev => prev.map(msg =>
      msg.id === data.messageId
        ? { ...msg, status: 'READ', readAt: data.readAt }
        : msg
    ));
  }, []);

  const handleWebSocketError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
    setConnectionError('Connection error occurred');
    setIsConnected(false);
  }, []);

  const handleDisconnected = useCallback((data: any) => {
    console.log('WebSocket disconnected:', data);
    setIsConnected(false);
    setConnectionError('Connection lost');
  }, []);

  // Chat invitation handlers
  const handleChatInvitationReceived = useCallback((invitation: any) => {
    console.log('Chat invitation received:', invitation);
    setCurrentInvitation(invitation);
    setShowInvitationModal(true);

    // Show notification
    setNotification({
      visible: true,
      type: 'received',
      senderName: invitation.sender.fullName,
      message: invitation.message,
    });
  }, []);

  const handleChatInvitationAccepted = useCallback((data: any) => {
    console.log('Chat invitation accepted:', data);
    const { invitationId, roomId } = data;

    // Show notification
    setNotification({
      visible: true,
      type: 'accepted',
      recipientName: 'User',
    });
  }, []);

  const handleChatInvitationRejected = useCallback((data: any) => {
    console.log('Chat invitation rejected:', data);
    const { invitationId } = data;

    // Show notification
    setNotification({
      visible: true,
      type: 'rejected',
      recipientName: 'User',
    });
  }, []);

  const setupWebSocketConnection = async () => {
    try {
      setConnectionError(null);

      // Connect to WebSocket
      const connected = await websocketService.connect(user?.id);

      if (connected) {
        setIsConnected(true);

        // Setup event listeners
        websocketService.on('new_message', handleNewMessage);
        websocketService.on('user_typing', handleUserTyping);
        websocketService.on('message_read', handleMessageRead);
        websocketService.on('error', handleWebSocketError);
        websocketService.on('disconnected', handleDisconnected);
        websocketService.on('chat_invitation_received', handleChatInvitationReceived);
        websocketService.on('chat_invitation_accepted', handleChatInvitationAccepted);
        websocketService.on('chat_invitation_rejected', handleChatInvitationRejected);

        // Add room joined event listener
        websocketService.on('room_joined', (data: any) => {
          console.log('Room joined successfully:', data);
          setConnectionError(null);
        });

        // Join room with partner
        websocketService.joinRoom(partner.id);

        console.log('WebSocket connected and room joined');
      } else {
        setConnectionError('Failed to connect to chat server');
      }
    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
      setConnectionError('Failed to connect to chat server');
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setConnectionError(null);

      // Test API connection first
      const connectionTest = await apiService.checkConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'Cannot connect to server');
      }

      // Get all users to find a partner (for demo purposes, get the first other user)
      const users = await apiService.getUsers();
      const otherUsers = users.filter((u: any) => u.id !== user?.id);

      if (otherUsers.length > 0) {
        const selectedPartner = otherUsers[0];
        setPartner(selectedPartner);

        // Load messages with this partner
        const messagesData = await apiService.getMessages(selectedPartner.id);
        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
      const errorMessage = error.message || 'Failed to load messages. Please try again.';
      setConnectionError(errorMessage);
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !partner || sending) return;

    try {
      setSending(true);
      const messageText = inputText.trim();
      setInputText(''); // Clear input immediately for better UX

      // Send via WebSocket if connected, otherwise fallback to API
      if (isConnected && websocketService.connected) {
        const sent = websocketService.sendMessage(partner.id, messageText, 'TEXT');
        if (!sent) {
          console.log('WebSocket send failed, falling back to API');
          // Fallback to API if WebSocket fails
          const newMessage = await apiService.sendMessage(
            partner.id,
            messageText,
            'TEXT'
          );
          setMessages(prev => [...prev, newMessage]);
        } else {
          console.log('Message sent via WebSocket successfully');
        }
      } else {
        console.log('WebSocket not connected, using API');
        // Fallback to API
        const newMessage = await apiService.sendMessage(
          partner.id,
          messageText,
          'TEXT'
        );

        // Add message to local state (WebSocket will handle this automatically when connected)
        setMessages(prev => [...prev, newMessage]);
      }

      // Stop typing indicator
      if (isConnected) {
        websocketService.sendTypingStatus(partner.id, false);
      }

      // Animate input
      inputScale.value = withSpring(0.95, {}, () => {
        inputScale.value = withSpring(1);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Restore input text on error
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Send typing indicator via WebSocket
    if (isConnected && partner) {
      const isTyping = text.trim().length > 0;
      websocketService.sendTypingStatus(partner.id, isTyping);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Invitation handling functions
  const acceptInvitation = () => {
    if (!currentInvitation) return;

    const success = websocketService.acceptChatInvitation(currentInvitation.id);
    if (success) {
      setShowInvitationModal(false);
      setCurrentInvitation(null);
    } else {
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const rejectInvitation = () => {
    if (!currentInvitation) return;

    const success = websocketService.rejectChatInvitation(currentInvitation.id);
    if (success) {
      setShowInvitationModal(false);
      setCurrentInvitation(null);
    } else {
      Alert.alert('Error', 'Failed to reject invitation');
    }
  };

  const dismissNotification = () => {
    setNotification({ ...notification, visible: false });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.partnerMessage]}>
        <LinearGradient
          colors={isMe ? theme.colors.gradients.romantic : theme.colors.gradients.starlight}
          style={[styles.messageBubble, isMe ? styles.myBubble : styles.partnerBubble]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.messageText, { color: theme.colors.etherealWhite }]}>
            {item.content}
          </Text>
        </LinearGradient>
        <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient
          colors={theme.colors.gradients.cosmic}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ActivityIndicator size="large" color={theme.colors.stardustPink} />
        <Text style={[styles.loadingText, { color: theme.colors.etherealWhite }]}>
          Loading messages...
        </Text>
        {connectionError && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInitialData}
          >
            <Text style={[styles.retryText, { color: theme.colors.stardustPink }]}>
              Retry Connection
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Cosmic Background */}
      <LinearGradient
        colors={theme.colors.gradients.cosmic}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.etherealWhite }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.etherealWhite }]}>
            {partner?.fullName || 'My Love'} 💖
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.moonlightSilver }]}>
            {connectionError ? 'Connection Error' :
              partnerTyping ? 'Typing...' :
                isConnected ? 'Online' : 'Connecting...'}
          </Text>
        </View>

        <TouchableOpacity style={styles.videoCallButton}>
          <Text style={styles.videoCallIcon}>📹</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Type a loving message..."
            placeholderTextColor={theme.colors.textSecondary}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            disabled={sending}
          >
            <LinearGradient
              colors={theme.colors.gradients.romantic}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.colors.etherealWhite} />
              ) : (
                <Text style={styles.sendIcon}>💕</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Emoji Reactions */}
        <View style={styles.emojiContainer}>
          {['💖', '😘', '🌹', '✨', '🌙', '💫'].map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiButton}
              onPress={() => handleInputChange(inputText + emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chat Invitation Modal */}
      <ChatInvitationModal
        visible={showInvitationModal}
        invitation={currentInvitation}
        onAccept={acceptInvitation}
        onReject={rejectInvitation}
        onClose={() => setShowInvitationModal(false)}
      />

      {/* Invitation Notification */}
      <InvitationNotification
        visible={notification.visible}
        type={notification.type}
        senderName={notification.senderName}
        recipientName={notification.recipientName}
        message={notification.message}
        onDismiss={dismissNotification}
        onPress={() => {
          if (notification.type === 'received' && currentInvitation) {
            setShowInvitationModal(true);
          }
          dismissNotification();
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  videoCallButton: {
    padding: 8,
  },
  videoCallIcon: {
    fontSize: 20,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  partnerMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  myBubble: {
    borderBottomRightRadius: 8,
  },
  partnerBubble: {
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  emojiButton: {
    padding: 8,
  },
  emoji: {
    fontSize: 24,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen;
