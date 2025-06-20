import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const AuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, {
          full_name: email.split('@')[0],
        });
      }

      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        if (isLogin) {
          navigation.navigate('Home' as never);
        } else {
          Alert.alert('Success', 'Account created! Please check your email to verify.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Cosmic Background */}
      <LinearGradient
        colors={theme.colors.gradients.romantic}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Hearts Animation */}
      <View style={styles.heartsContainer}>
        {Array.from({ length: 20 }).map((_, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.floatingHeart,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                opacity: Math.random() * 0.3 + 0.1,
                fontSize: Math.random() * 20 + 10,
              },
            ]}
          >
            💕
          </Animated.Text>
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.etherealWhite }]}>
            {isLogin ? 'Welcome Back' : 'Join Our Universe'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.moonlightSilver }]}>
            {isLogin ? 'Enter your cosmic realm' : 'Create your love story'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}

          {/* Auth Button */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleAuth}
            disabled={loading}
          >
            <LinearGradient
              colors={[theme.colors.stardustPink, theme.colors.cosmicGold]}
              style={styles.authButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.authButtonText, { color: theme.colors.etherealWhite }]}>
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Toggle Auth Mode */}
          <TouchableOpacity style={styles.toggleButton} onPress={toggleAuthMode}>
            <Text style={[styles.toggleText, { color: theme.colors.moonlightSilver }]}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: theme.colors.stardustPink, fontWeight: 'bold' }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
  heartsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingHeart: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  authButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  authButtonGradient: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontSize: 14,
  },
});

export default AuthScreen;
