import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const ProposalScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showProposal, setShowProposal] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const starsAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  const proposalSteps = [
    "From the moment I met you...",
    "You became my universe...",
    "Every star in the sky...",
    "Reminds me of your beauty...",
    "Will you marry me?",
  ];

  useEffect(() => {
    startUniverseAnimation();
  }, []);

  const startUniverseAnimation = () => {
    // Start cosmic background animations
    Animated.parallel([
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(starsAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(starsAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Start the proposal sequence
    setTimeout(() => {
      startProposalSequence();
    }, 2000);
  };

  const startProposalSequence = () => {
    setShowProposal(true);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      showNextStep();
    });
  };

  const showNextStep = () => {
    if (currentStep < proposalSteps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        
        // Animate text appearance
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (currentStep + 1 < proposalSteps.length - 1) {
            showNextStep();
          } else {
            // Final step - show ring
            showRingAnimation();
          }
        });
      }, 3000);
    }
  };

  const showRingAnimation = () => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(ringAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(heartAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(heartAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }, 2000);
  };

  const handleResponse = (answer: 'yes' | 'no') => {
    if (answer === 'yes') {
      // Celebration animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          { iterations: 10 }
        ),
      ]).start(() => {
        setTimeout(() => {
          navigation.navigate('Home' as never);
        }, 3000);
      });
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const starsOpacity = starsAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 1, 0.2],
  });

  const heartScale = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Universe Background */}
      <LinearGradient
        colors={['#000011', '#1a0033', '#330066', '#000011']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Stars */}
      <Animated.View style={[styles.starsContainer, { opacity: starsOpacity }]}>
        {Array.from({ length: 100 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                opacity: Math.random() * 0.8 + 0.2,
                transform: [
                  {
                    scale: Math.random() * 1.5 + 0.5,
                  },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Rotating Galaxy */}
      <Animated.View
        style={[
          styles.galaxy,
          {
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.stardustPink, theme.colors.cosmicGold, theme.colors.galaxyBlue]}
          style={styles.galaxyRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={[styles.backText, { color: theme.colors.etherealWhite }]}>← Back</Text>
      </TouchableOpacity>

      {/* Proposal Content */}
      {showProposal && (
        <Animated.View
          style={[
            styles.proposalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={[styles.proposalText, { color: theme.colors.etherealWhite }]}>
            {proposalSteps[currentStep]}
          </Text>

          {/* Ring Animation */}
          {currentStep === proposalSteps.length - 1 && (
            <Animated.View
              style={[
                styles.ringContainer,
                {
                  opacity: ringAnim,
                  transform: [{ scale: ringAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={[theme.colors.cosmicGold, theme.colors.stardustPink]}
                style={styles.ring}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.diamond}>
                  <Text style={styles.diamondIcon}>💎</Text>
                </View>
              </LinearGradient>

              {/* Floating Hearts */}
              <Animated.View
                style={[
                  styles.heartsContainer,
                  {
                    transform: [{ scale: heartScale }],
                  },
                ]}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.floatingHeart,
                      {
                        transform: [
                          {
                            rotate: `${index * 45}deg`,
                          },
                        ],
                      },
                    ]}
                  >
                    💖
                  </Text>
                ))}
              </Animated.View>

              {/* Response Buttons */}
              <View style={styles.responseContainer}>
                <TouchableOpacity
                  style={styles.responseButton}
                  onPress={() => handleResponse('yes')}
                >
                  <LinearGradient
                    colors={theme.colors.gradients.romantic}
                    style={styles.responseButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.responseButtonText, { color: theme.colors.etherealWhite }]}>
                      Yes! 💖
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.responseButton}
                  onPress={() => handleResponse('no')}
                >
                  <View style={[styles.responseButtonOutline, { borderColor: theme.colors.moonlightSilver }]}>
                    <Text style={[styles.responseButtonText, { color: theme.colors.moonlightSilver }]}>
                      Not yet
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
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
  galaxy: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
  },
  galaxyRing: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.4,
    opacity: 0.3,
  },
  backButton: {
    position: 'absolute',
    top: StatusBar.currentHeight || 44,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  proposalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  proposalText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 48,
  },
  ringContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  diamond: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondIcon: {
    fontSize: 32,
  },
  heartsContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: -40,
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 20,
    top: 20,
    left: 90,
  },
  responseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 48,
  },
  responseButton: {
    flex: 1,
    marginHorizontal: 16,
  },
  responseButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  responseButtonOutline: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
  },
  responseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProposalScreen;
