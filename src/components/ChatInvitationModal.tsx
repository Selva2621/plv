import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface ChatInvitation {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  sender: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ChatInvitationModalProps {
  visible: boolean;
  invitation: ChatInvitation | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function ChatInvitationModal({
  visible,
  invitation,
  onAccept,
  onReject,
  onClose,
}: ChatInvitationModalProps) {
  const { theme } = useTheme();

  if (!invitation) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={theme.colors.gradients.romantic}
          style={styles.modalContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {invitation.sender.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.senderName, { color: theme.colors.etherealWhite }]}>
                {invitation.sender.fullName}
              </Text>
              <Text style={[styles.inviteTime, { color: theme.colors.moonlightSilver }]}>
                {formatTime(invitation.createdAt)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.etherealWhite }]}>
            💬 Chat Invitation
          </Text>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={[styles.messageLabel, { color: theme.colors.moonlightSilver }]}>
              Message:
            </Text>
            <Text style={[styles.messageText, { color: theme.colors.etherealWhite }]}>
              "{invitation.message}"
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={[styles.buttonText, { color: theme.colors.etherealWhite }]}>
                Decline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton, { backgroundColor: theme.colors.cosmicGold }]}
              onPress={onAccept}
            >
              <Text style={[styles.buttonText, { color: theme.colors.deepSpace }]}>
                Accept & Chat
              </Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: theme.colors.moonlightSilver }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  inviteTime: {
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageContainer: {
    width: '100%',
    marginBottom: 25,
  },
  messageLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  acceptButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
