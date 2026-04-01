import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS 
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useDelivery } from '@/contexts/DeliveryContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FloatingDeliveryBubble() {
  const { activeDelivery } = useDelivery();
  const router = useRouter();

  // Posições iniciais (Lado direito, meio da tela)
  const translateX = useSharedValue(SCREEN_WIDTH - 80);
  const translateY = useSharedValue(SCREEN_HEIGHT / 2);
  const context = useSharedValue({ x: 0, y: 0 });

  const goToDelivery = () => {
    router.push({
      pathname: "/driver/delivery",
      params: { orderId: activeDelivery?.id }
    });
  };

  // Gesto de Toque (Tap)
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(goToDelivery)();
    });

  // Gesto de Arrastar (Pan)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
      translateY.value = event.translationY + context.value.y;
    })
    .onEnd(() => {
      // "Gruda" na borda lateral mais próxima (Efeito Uber/Messenger)
      if (translateX.value > SCREEN_WIDTH / 2) {
        translateX.value = withSpring(SCREEN_WIDTH - 70);
      } else {
        translateX.value = withSpring(10);
      }
    });

  // Combina os gestos: permite ambos, mas prioriza a intenção
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
  }));

  if(activeDelivery){
    return (
        <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.bubble, animatedStyle]}>
            <MaterialCommunityIcons name="motorbike" size={28} color="#FFF" />
            <Animated.View style={styles.statusDot} />
        </Animated.View>
        </GestureDetector>
      );
  }
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff8c00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 9999, // Garante que fique acima de tudo
  },
  statusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  }
});