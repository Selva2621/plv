import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: string;
  colors: readonly string[];
  onPress: () => void;
  delay: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ title, subtitle, icon, colors, onPress, delay }) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.menuItem,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} style={styles.menuItemTouchable}>
        <LinearGradient
          colors={colors as any}
          style={styles.menuItemGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemIcon}>{icon}</Text>
            <View style={styles.menuItemText}>
              <Text style={[styles.menuItemTitle, { color: theme.colors.etherealWhite }]}>
                {title}
              </Text>
              <Text style={[styles.menuItemSubtitle, { color: theme.colors.moonlightSilver }]}>
                {subtitle}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Header animation
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for hearts
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const menuItems = [
    {
      title: 'Photo Gallery',
      subtitle: 'Our cosmic memories',
      icon: '🌌',
      colors: theme.colors.gradients.starlight,
      onPress: () => navigation.navigate('PhotoGallery' as never),
      delay: 100,
    },
    {
      title: 'Love Chat',
      subtitle: 'Whisper sweet nothings',
      icon: '💬',
      colors: theme.colors.gradients.romantic,
      onPress: () => navigation.navigate('Chat' as never),
      delay: 200,
    },
    ...(isAdmin ? [{
      title: 'Admin Chat',
      subtitle: 'Manage user conversations',
      icon: '👑',
      colors: theme.colors.gradients.cosmic,
      onPress: () => navigation.navigate('AdminChat' as never),
      delay: 250,
    }] : []),
    {
      title: 'Video Call',
      subtitle: 'See your starlight',
      icon: '📹',
      colors: theme.colors.gradients.sunset,
      onPress: () => navigation.navigate('VideoCall' as never),
      delay: isAdmin ? 350 : 300,
    },
    {
      title: 'Love Proposal',
      subtitle: 'The universe awaits',
      icon: '💍',
      colors: theme.colors.gradients.cosmic,
      onPress: () => navigation.navigate('Proposal' as never),
      delay: isAdmin ? 450 : 400,
    },
  ];

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
      <View style={styles.heartsContainer}>
        {Array.from({ length: 15 }).map((_, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.floatingHeart,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                opacity: Math.random() * 0.3 + 0.1,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            ✨
          </Animated.Text>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, { color: theme.colors.moonlightSilver }]}>
              Welcome back,
            </Text>
            <Text style={[styles.nameText, { color: theme.colors.etherealWhite }]}>
              My Love 💖
            </Text>
          </View>

          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Text style={[styles.signOutText, { color: theme.colors.stardustPink }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Romantic Quote */}
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: headerAnim,
            },
          ]}
        >
          <Text style={[styles.quote, { color: theme.colors.roseGold }]}>
            "In all the universe, there is no love like ours"
          </Text>
        </Animated.View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              colors={item.colors}
              onPress={item.onPress}
              delay={item.delay}
            />
          ))}
        </View>
      </ScrollView>
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
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quoteContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.9,
  },
  menuContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  menuItem: {
    marginBottom: 16,
  },
  menuItemTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItemGradient: {
    padding: 20,
    borderRadius: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default HomeScreen;
