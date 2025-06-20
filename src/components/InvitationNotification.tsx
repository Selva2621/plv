import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface InvitationNotificationProps {
  visible: boolean;
  type: 'received' | 'accepted' | 'rejected' | 'sent';
  senderName?: string;
  recipientName?: string;
  message?: string;
  onPress?: () => void;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

const { width } = Dimensions.get('window');

export default function InvitationNotification({
  visible,
  type,
  senderName,
  recipientName,
  message,
  onPress,
  onDismiss,
  autoHide = true,
  duration = 4000,
}: InvitationNotificationProps) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide
      if (autoHide) {
        timeoutRef.current = setTimeout(() => {
          hideNotification();
        }, duration);
      }
    } else {
      hideNotification();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getNotificationContent = () => {
    switch (type) {
      case 'received':
        return {
          icon: '💬',
          title: 'Chat Invitation',
          subtitle: `${senderName} wants to chat`,
          colors: theme.colors.gradients.romantic,
        };
      case 'accepted':
        return {
          icon: '✅',
          title: 'Invitation Accepted!',
          subtitle: `${recipientName} accepted your chat invitation`,
          colors: theme.colors.gradients.starlight,
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'Invitation Declined',
          subtitle: `${recipientName} declined your chat invitation`,
          colors: theme.colors.gradients.sunset,
        };
      case 'sent':
        return {
          icon: '📤',
          title: 'Invitation Sent',
          subtitle: `Chat invitation sent to ${recipientName}`,
          colors: theme.colors.gradients.cosmic,
        };
      default:
        return {
          icon: '💬',
          title: 'Notification',
          subtitle: 'New notification',
          colors: theme.colors.gradients.romantic,
        };
    }
  };

  if (!visible) return null;

  const content = getNotificationContent();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={content.colors}
          style={styles.notification}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{content.icon}</Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.etherealWhite }]}>
              {content.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.moonlightSilver }]}>
              {content.subtitle}
            </Text>
            {message && (
              <Text style={[styles.message, { color: theme.colors.etherealWhite }]}>
                "{message}"
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideNotification}
          >
            <Text style={[styles.closeText, { color: theme.colors.moonlightSilver }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  touchable: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    minHeight: 80,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
