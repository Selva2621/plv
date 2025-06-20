import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

interface Photo {
  id: string;
  uri: string;
  title?: string;
  date?: string;
}

const PhotoGalleryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [photos, setPhotos] = useState<Photo[]>([
    // Sample photos - replace with actual photo data
    { id: '1', uri: 'https://picsum.photos/400/600?random=1', title: 'Our First Date', date: '2024-01-14' },
    { id: '2', uri: 'https://picsum.photos/400/600?random=2', title: 'Sunset Together', date: '2024-02-14' },
    { id: '3', uri: 'https://picsum.photos/400/600?random=3', title: 'Dancing Under Stars', date: '2024-03-14' },
    { id: '4', uri: 'https://picsum.photos/400/600?random=4', title: 'Beach Walk', date: '2024-04-14' },
    { id: '5', uri: 'https://picsum.photos/400/600?random=5', title: 'Cozy Evening', date: '2024-05-14' },
    { id: '6', uri: 'https://picsum.photos/400/600?random=6', title: 'Adventure Time', date: '2024-06-14' },
  ]);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: Photo = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        title: 'New Memory',
        date: new Date().toISOString().split('T')[0],
      };
      setPhotos([newPhoto, ...photos]);
    }
  };

  const openPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
    scale.value = withSpring(1);
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = withTiming(1);
  };

  const closeModal = () => {
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setModalVisible)(false);
      runOnJS(setSelectedPhoto)(null);
    });
  };

  const onPinchEvent = (event: any) => {
    scale.value = event.nativeEvent.scale;
  };

  const onPanEvent = (event: any) => {
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
    };
  });

  const renderPhoto = ({ item, index }: { item: Photo; index: number }) => {
    const animatedItemStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: 1 },
        ],
      };
    });

    return (
      <Animated.View style={[styles.photoContainer, animatedItemStyle]}>
        <TouchableOpacity onPress={() => openPhoto(item)} style={styles.photoTouchable}>
          <Image source={{ uri: item.uri }} style={styles.photo} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)'] as const}
            style={styles.photoOverlay}
          >
            <View style={styles.photoInfo}>
              <Text style={[styles.photoTitle, { color: theme.colors.etherealWhite }]}>
                {item.title}
              </Text>
              <Text style={[styles.photoDate, { color: theme.colors.moonlightSilver }]}>
                {item.date}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Cosmic Background */}
      <LinearGradient
        colors={theme.colors.gradients.starlight}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.etherealWhite }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.etherealWhite }]}>
          Our Cosmic Gallery
        </Text>

        <TouchableOpacity onPress={pickImage} style={styles.addButton}>
          <Text style={[styles.addText, { color: theme.colors.stardustPink }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.photoGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* Photo Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackground} onPress={closeModal} />

          {selectedPhoto && (
            <PanGestureHandler onGestureEvent={onPanEvent}>
              <PinchGestureHandler onGestureEvent={onPinchEvent}>
                <Animated.View style={[styles.modalContent, animatedStyle]}>
                  <Image source={{ uri: selectedPhoto.uri }} style={styles.modalImage} />

                  <View style={styles.modalInfo}>
                    <Text style={[styles.modalTitle, { color: theme.colors.etherealWhite }]}>
                      {selectedPhoto.title}
                    </Text>
                    <Text style={[styles.modalDate, { color: theme.colors.moonlightSilver }]}>
                      {selectedPhoto.date}
                    </Text>
                  </View>
                </Animated.View>
              </PinchGestureHandler>
            </PanGestureHandler>
          )}
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoGrid: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  photoContainer: {
    flex: 1,
    margin: 8,
  },
  photoTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 12,
  },
  photoInfo: {
    alignItems: 'flex-start',
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  photoDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: height * 0.6,
    resizeMode: 'contain',
    borderRadius: 16,
  },
  modalInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default PhotoGalleryScreen;
