import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const startAnimations = () => {
    // Pulse animation for call button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating hearts animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startCall = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required for video calls.');
        return;
      }
    }

    setIsCallActive(true);
    setCallDuration(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallDuration(0);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const heartOpacity = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={{ color: theme.colors.text }}>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Cosmic Background */}
      <LinearGradient
        colors={theme.colors.gradients.cosmic}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Hearts */}
      <Animated.View style={[styles.heartsContainer, { opacity: heartOpacity }]}>
        {Array.from({ length: 20 }).map((_, index) => (
          <Text
            key={index}
            style={[
              styles.floatingHeart,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                fontSize: Math.random() * 20 + 15,
              },
            ]}
          >
            💕
          </Text>
        ))}
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.etherealWhite }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.etherealWhite }]}>
          Video Call
        </Text>

        <View style={styles.headerRight} />
      </View>

      {!isCallActive ? (
        // Pre-call screen
        <View style={styles.preCallContainer}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={theme.colors.gradients.romantic}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>💖</Text>
            </LinearGradient>
          </View>

          <Text style={[styles.contactName, { color: theme.colors.etherealWhite }]}>
            My Love
          </Text>

          <Text style={[styles.contactStatus, { color: theme.colors.moonlightSilver }]}>
            Tap to start video call
          </Text>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity onPress={startCall} style={styles.callButton}>
              <LinearGradient
                colors={theme.colors.gradients.romantic}
                style={styles.callButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.callIcon}>📹</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        // Active call screen
        <Animated.View style={[styles.callContainer, { opacity: fadeAnim }]}>
          {/* Video Area */}
          <View style={styles.videoContainer}>
            {!isVideoOff ? (
              <CameraView style={styles.camera} facing="front" />
            ) : (
              <View style={styles.videoOff}>
                <Text style={[styles.videoOffText, { color: theme.colors.etherealWhite }]}>
                  Video Off
                </Text>
              </View>
            )}

            {/* Partner Video (Placeholder) */}
            <View style={styles.partnerVideo}>
              <LinearGradient
                colors={theme.colors.gradients.starlight}
                style={styles.partnerVideoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.partnerVideoText}>💖</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Call Info */}
          <View style={styles.callInfo}>
            <Text style={[styles.callContactName, { color: theme.colors.etherealWhite }]}>
              My Love
            </Text>
            <Text style={[styles.callDuration, { color: theme.colors.moonlightSilver }]}>
              {formatDuration(callDuration)}
            </Text>
          </View>

          {/* Call Controls */}
          <View style={styles.callControls}>
            <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
              <LinearGradient
                colors={isMuted ? ['#FF6B6B', '#FF8E8E'] as const : theme.colors.gradients.starlight}
                style={styles.controlButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={endCall} style={styles.endCallButton}>
              <LinearGradient
                colors={['#FF4757', '#FF6B7A'] as const}
                style={styles.endCallButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.endCallIcon}>📞</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleVideo} style={styles.controlButton}>
              <LinearGradient
                colors={isVideoOff ? ['#FF6B6B', '#FF8E8E'] as const : theme.colors.gradients.starlight}
                style={styles.controlButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.controlIcon}>{isVideoOff ? '📹' : '📷'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
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
  heartsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingHeart: {
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 60,
  },
  preCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  avatarContainer: {
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
  },
  contactName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactStatus: {
    fontSize: 16,
    marginBottom: 48,
    opacity: 0.8,
  },
  callButton: {
    width: 80,
    height: 80,
  },
  callButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 32,
  },
  callContainer: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  videoOff: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  videoOffText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  partnerVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  partnerVideoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerVideoText: {
    fontSize: 32,
  },
  callInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  callContactName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  callDuration: {
    fontSize: 14,
    opacity: 0.8,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  controlButton: {
    width: 60,
    height: 60,
    marginHorizontal: 16,
  },
  controlButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
  },
  endCallButton: {
    width: 70,
    height: 70,
    marginHorizontal: 16,
  },
  endCallButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallIcon: {
    fontSize: 28,
    transform: [{ rotate: '135deg' }],
  },
});

export default VideoCallScreen;
