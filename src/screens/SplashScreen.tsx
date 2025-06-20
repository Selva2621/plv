import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(starAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Navigate after loading
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          navigation.navigate('Home' as never);
        } else {
          navigation.navigate('Auth' as never);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading, navigation]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const starOpacity = starAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

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

      {/* Animated Stars */}
      <Animated.View style={[styles.starsContainer, { opacity: starOpacity }]}>
        {Array.from({ length: 50 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                opacity: Math.random() * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Rotating Cosmic Ring */}
        <Animated.View
          style={[
            styles.cosmicRing,
            {
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.stardustPink, theme.colors.cosmicGold, theme.colors.galaxyBlue]}
            style={styles.ring}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Heart Icon */}
        <View style={styles.heartContainer}>
          <Text style={[styles.heartIcon, { color: theme.colors.stardustPink }]}>
            💖
          </Text>
        </View>

        {/* App Title */}
        <Text style={[styles.title, { color: theme.colors.etherealWhite }]}>
          Cosmic Love
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.moonlightSilver }]}>
          A Universe of Romance
        </Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: theme.colors.stardustPink, opacity: starOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: theme.colors.cosmicGold, opacity: starOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: theme.colors.galaxyBlue, opacity: starOpacity },
            ]}
          />
        </View>
      </Animated.View>
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
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cosmicRing: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  ring: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  heartContainer: {
    marginBottom: 24,
  },
  heartIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default SplashScreen;
