import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '../config/env';

// Event types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  recipient: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  type: string;
  status: string;
  readAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface TypingEvent {
  userId: string;
  user: User;
  isTyping: boolean;
}

export interface MessageReadEvent {
  messageId: string;
  readBy: string;
  readAt: string;
}

// Event listeners type
type EventListener<T = any> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = ENV.WEBSOCKET_RECONNECT_ATTEMPTS;
  private reconnectDelay = ENV.WEBSOCKET_RECONNECT_DELAY;
  private currentUserId: string | null = null;
  private eventListeners = new Map<string, Set<EventListener>>();

  constructor() {
    console.log('WebSocketService initialized');
  }

  async connect(userId?: string): Promise<boolean> {
    try {
      if (this.socket?.connected) {
        console.log('WebSocket already connected');
        return true;
      }

      // Get auth token with retry logic
      const token = await this.getAuthTokenWithRetry();
      if (!token) {
        console.error('No auth token found for WebSocket connection after retries');
        return false;
      }

      this.currentUserId = userId || null;

      console.log(`Connecting to WebSocket: ${ENV.WEBSOCKET_URL} with userId: ${this.currentUserId}`);

      this.socket = io(ENV.WEBSOCKET_URL, {
        auth: {
          token,
          userId: this.currentUserId, // Use actual user ID from authentication
        },
        transports: ['websocket', 'polling'],
        timeout: ENV.WEBSOCKET_TIMEOUT,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          resolve(false);
          return;
        }

        this.socket.on('connect', () => {
          console.log('WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.setupEventListeners();
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          resolve(false);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.emit('disconnected', { reason });
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        });
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      return false;
    }
  }

  private async getAuthTokenWithRetry(maxRetries: number = 3, delay: number = 1000): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          console.log(`Auth token found on attempt ${i + 1}`);
          return token;
        }

        if (i < maxRetries - 1) {
          console.log(`Auth token not found, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Error getting auth token on attempt ${i + 1}:`, error);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    return null;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Message events
    this.socket.on('new_message', (message: Message) => {
      console.log('Received new message:', message);
      this.emit('new_message', message);
    });

    this.socket.on('message_read', (data: MessageReadEvent) => {
      console.log('Message read:', data);
      this.emit('message_read', data);
    });

    // Room events
    this.socket.on('room_joined', (data: any) => {
      console.log('Room joined:', data);
      this.emit('room_joined', data);
    });

    this.socket.on('room_left', (data: any) => {
      console.log('Room left:', data);
      this.emit('room_left', data);
    });

    // Typing events
    this.socket.on('user_typing', (data: TypingEvent) => {
      console.log('User typing:', data);
      this.emit('user_typing', data);
    });

    // User presence events
    this.socket.on('user_online', (data: { userId: string; user: User }) => {
      console.log('User online:', data);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data: { userId: string }) => {
      console.log('User offline:', data);
      this.emit('user_offline', data);
    });

    // Room events
    this.socket.on('room_joined', (data: { roomId: string; recipientId: string }) => {
      console.log('Room joined:', data);
      this.emit('room_joined', data);
    });

    this.socket.on('room_left', (data: { roomId: string; recipientId: string }) => {
      console.log('Room left:', data);
      this.emit('room_left', data);
    });

    this.socket.on('user_joined_room', (data: { userId: string; user: User; roomId: string }) => {
      console.log('User joined room:', data);
      this.emit('user_joined_room', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
    }
  }

  // Room management
  joinRoom(recipientId: string) {
    if (!this.socket?.connected) {
      console.error('Cannot join room: WebSocket not connected');
      return;
    }

    console.log(`Joining room with recipient: ${recipientId}`);
    this.socket.emit('join_room', { recipientId });
  }

  leaveRoom(recipientId: string) {
    if (!this.socket?.connected) {
      console.error('Cannot leave room: WebSocket not connected');
      return;
    }

    console.log(`Leaving room with recipient: ${recipientId}`);
    this.socket.emit('leave_room', { recipientId });
  }

  // Message operations
  sendMessage(recipientId: string, content: string, type: string = 'TEXT') {
    if (!this.socket?.connected) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }

    console.log(`Sending message to ${recipientId}:`, content);
    this.socket.emit('send_message', {
      recipientId,
      content,
      type,
    });
    return true;
  }

  markMessageAsRead(messageId: string) {
    if (!this.socket?.connected) {
      console.error('Cannot mark message as read: WebSocket not connected');
      return;
    }

    console.log(`Marking message as read: ${messageId}`);
    this.socket.emit('mark_message_read', { messageId });
  }

  // Typing indicators
  sendTypingStatus(recipientId: string, isTyping: boolean) {
    if (!this.socket?.connected) {
      console.error('Cannot send typing status: WebSocket not connected');
      return;
    }

    this.socket.emit('typing', {
      recipientId,
      isTyping,
    });
  }

  // Chat invitation operations
  getActiveUsers() {
    if (!this.socket?.connected) {
      console.error('Cannot get active users: WebSocket not connected');
      return;
    }

    console.log('Requesting active users list');
    this.socket.emit('get_active_users');
  }

  sendChatInvitation(recipientId: string, message: string) {
    if (!this.socket?.connected) {
      console.error('Cannot send chat invitation: WebSocket not connected');
      return false;
    }

    console.log(`Sending chat invitation to ${recipientId}:`, message);
    this.socket.emit('send_chat_invitation', {
      recipientId,
      message,
    });
    return true;
  }

  acceptChatInvitation(invitationId: string) {
    if (!this.socket?.connected) {
      console.error('Cannot accept chat invitation: WebSocket not connected');
      return false;
    }

    console.log(`Accepting chat invitation: ${invitationId}`);
    this.socket.emit('accept_chat_invitation', { invitationId });
    return true;
  }

  rejectChatInvitation(invitationId: string) {
    if (!this.socket?.connected) {
      console.error('Cannot reject chat invitation: WebSocket not connected');
      return false;
    }

    console.log(`Rejecting chat invitation: ${invitationId}`);
    this.socket.emit('reject_chat_invitation', { invitationId });
    return true;
  }

  // Generic emit method for custom events
  emitEvent(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.error(`Cannot emit ${event}: WebSocket not connected`);
      return false;
    }

    console.log(`Emitting ${event}:`, data);
    this.socket.emit(event, data);
    return true;
  }

  // Event management
  on<T = any>(event: string, listener: EventListener<T>) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off<T = any>(event: string, listener: EventListener<T>) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  private emit<T = any>(event: string, data: T) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  get userId(): string | null {
    return this.currentUserId;
  }

  // Utility methods
  async reconnect(): Promise<boolean> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
    return this.connect(this.currentUserId || undefined);
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    userId: string | null;
  } {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.currentUserId,
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
