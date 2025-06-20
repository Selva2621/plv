import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import websocketService from '../services/websocket';

interface ActiveUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  connectedAt: string;
  socketId: string;
}

interface ChatInvitation {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  sender: ActiveUser;
}

export default function AdminChatScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState<ChatInvitation[]>([]);

  // WebSocket event handlers
  const handleActiveUsersUpdated = useCallback((data: { activeUsers: ActiveUser[] }) => {
    console.log('Active users updated:', data.activeUsers);
    // Filter out current user (admin)
    const otherUsers = data.activeUsers.filter(u => u.id !== user?.id);
    setActiveUsers(otherUsers);
  }, [user?.id]);

  const handleActiveUsersList = useCallback((data: { activeUsers: ActiveUser[] }) => {
    console.log('Active users list received:', data.activeUsers);
    // Filter out current user (admin)
    const otherUsers = data.activeUsers.filter(u => u.id !== user?.id);
    setActiveUsers(otherUsers);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  const handleInvitationSent = useCallback((data: { invitationId: string; recipientId: string }) => {
    console.log('Invitation sent:', data);
    Alert.alert('Success', 'Chat invitation sent successfully!');
    setShowInviteModal(false);
    setInviteMessage('');
    setSelectedUser(null);
  }, []);

  const handleInvitationAccepted = useCallback((data: { invitationId: string; roomId: string }) => {
    console.log('Invitation accepted:', data);
    Alert.alert(
      'Invitation Accepted!',
      'Your chat invitation was accepted!',
      [
        {
          text: 'Start Chat',
          onPress: () => {
            // Navigate to chat - we'll need to get the partner info from the selected user
            if (selectedUser) {
              navigation.navigate('Chat', { partner: selectedUser });
            }
          }
        },
        { text: 'Later', style: 'cancel' }
      ]
    );
  }, [selectedUser, navigation]);

  const handleInvitationRejected = useCallback((data: { invitationId: string }) => {
    console.log('Invitation rejected:', data);
    Alert.alert('Invitation Declined', 'Your chat invitation was declined.');
  }, []);

  const handleWebSocketError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
    Alert.alert('Connection Error', error.message || 'Failed to connect to chat server');
  }, []);

  const setupWebSocketConnection = async () => {
    try {
      setLoading(true);

      // Ensure user is authenticated before connecting
      if (!user?.id) {
        console.log('User not authenticated yet, waiting...');
        setLoading(false);
        return;
      }

      // Connect to WebSocket
      const connected = await websocketService.connect(user.id);

      if (connected) {
        setIsConnected(true);

        // Setup event listeners
        websocketService.on('active_users_updated', handleActiveUsersUpdated);
        websocketService.on('active_users_list', handleActiveUsersList);
        websocketService.on('chat_invitation_sent', handleInvitationSent);
        websocketService.on('chat_invitation_accepted', handleInvitationAccepted);
        websocketService.on('chat_invitation_rejected', handleInvitationRejected);
        websocketService.on('error', handleWebSocketError);

        // Request active users list
        websocketService.getActiveUsers();

        console.log('Admin WebSocket connected');
      } else {
        Alert.alert('Error', 'Failed to connect to chat server');
        setLoading(false);
      }
    } catch (error) {
      console.error('WebSocket connection error:', error);
      Alert.alert('Error', 'Failed to connect to chat server');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only setup WebSocket connection when user is authenticated
    if (user?.id) {
      setupWebSocketConnection();
    }

    return () => {
      // Cleanup event listeners
      websocketService.off('active_users_updated', handleActiveUsersUpdated);
      websocketService.off('active_users_list', handleActiveUsersList);
      websocketService.off('chat_invitation_sent', handleInvitationSent);
      websocketService.off('chat_invitation_accepted', handleInvitationAccepted);
      websocketService.off('chat_invitation_rejected', handleInvitationRejected);
      websocketService.off('error', handleWebSocketError);
    };
  }, [user?.id]); // Add user.id as dependency

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (isConnected) {
      websocketService.getActiveUsers();
    } else {
      setupWebSocketConnection();
    }
  }, [isConnected]);

  const handleRetryConnection = useCallback(() => {
    if (user?.id) {
      setupWebSocketConnection();
    } else {
      Alert.alert('Error', 'Please ensure you are logged in before connecting to chat');
    }
  }, [user?.id]);

  const handleInviteUser = (user: ActiveUser) => {
    setSelectedUser(user);
    setInviteMessage(`Hi ${user.fullName}, would you like to have a chat?`);
    setShowInviteModal(true);
  };

  const sendInvitation = () => {
    if (!selectedUser || !inviteMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (!isConnected) {
      Alert.alert('Error', 'Not connected to chat server');
      return;
    }

    websocketService.sendChatInvitation(selectedUser.id, inviteMessage.trim());
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderUserItem = ({ item }: { item: ActiveUser }) => (
    <View style={styles.userItem}>
      <LinearGradient
        colors={theme.colors.gradients.starlight}
        style={styles.userCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.etherealWhite }]}>
              {item.fullName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.moonlightSilver }]}>
              {item.email}
            </Text>
            <Text style={[styles.userStatus, { color: theme.colors.cosmicGold }]}>
              Online • {formatTime(item.connectedAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.inviteButton, { backgroundColor: theme.colors.cosmicGold }]}
          onPress={() => handleInviteUser(item)}
        >
          <Text style={[styles.inviteButtonText, { color: theme.colors.deepSpace }]}>
            Invite to Chat
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.colors.gradients.cosmic}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.etherealWhite }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.etherealWhite }]}>
          Admin Chat 👑
        </Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
          <Text style={[styles.statusText, { color: theme.colors.moonlightSilver }]}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Active Users List */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.colors.etherealWhite }]}>
          Active Users ({activeUsers.length})
        </Text>

        {!isConnected && !loading && (
          <View style={styles.connectionErrorContainer}>
            <Text style={[styles.connectionErrorText, { color: theme.colors.moonlightSilver }]}>
              ⚠️ Not connected to chat server
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.cosmicGold }]}
              onPress={handleRetryConnection}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.deepSpace }]}>
                Retry Connection
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.moonlightSilver }]}>
              {isConnected ? 'Loading active users...' : 'Connecting to chat server...'}
            </Text>
          </View>
        ) : activeUsers.length === 0 && isConnected ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.moonlightSilver }]}>
              No active users online
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Pull down to refresh
            </Text>
          </View>
        ) : isConnected ? (
          <FlatList
            data={activeUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.usersList}
            contentContainerStyle={styles.usersListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.cosmicGold}
              />
            }
          />
        ) : null}
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={theme.colors.gradients.romantic}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.etherealWhite }]}>
              Invite {selectedUser?.fullName} to Chat
            </Text>

            <TextInput
              style={[styles.messageInput, {
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Enter your invitation message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inviteMessage}
              onChangeText={setInviteMessage}
              multiline
              maxLength={200}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.etherealWhite }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, { backgroundColor: theme.colors.cosmicGold }]}
                onPress={sendInvitation}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.deepSpace }]}>
                  Send Invite
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  usersList: {
    flex: 1,
  },
  usersListContent: {
    paddingBottom: 20,
  },
  userItem: {
    marginBottom: 15,
  },
  userCard: {
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  inviteButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  connectionErrorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  connectionErrorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
