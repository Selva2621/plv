import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Environment Configuration
import { validateEnv, logEnvConfig } from './src/config/env';

// Context Providers
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import AdminChatScreen from './src/screens/AdminChatScreen';
import PhotoGalleryScreen from './src/screens/PhotoGalleryScreen';
import VideoCallScreen from './src/screens/VideoCallScreen';
import ProposalScreen from './src/screens/ProposalScreen';

const Stack = createStackNavigator();

export default function App() {
  // Initialize environment configuration
  useEffect(() => {
    try {
      validateEnv();
      logEnvConfig();
      console.log('✅ Environment configuration loaded successfully');
    } catch (error) {
      console.error('❌ Environment configuration error:', error.message);
      // You might want to show an error screen here in production
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                cardStyleInterpolator: ({ current, layouts }) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateX: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [layouts.screen.width, 0],
                          }),
                        },
                      ],
                    },
                  };
                },
              }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="AdminChat" component={AdminChatScreen} />
              <Stack.Screen name="PhotoGallery" component={PhotoGalleryScreen} />
              <Stack.Screen name="VideoCall" component={VideoCallScreen} />
              <Stack.Screen name="Proposal" component={ProposalScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
