import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS, interpolateColor } from 'react-native-reanimated';
import { OrderItemsType, OrderType, useOrders } from '@/contexts/MyOrdersContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; 
const MAIN_COLOR =  process.env.EXPO_PUBLIC_MAIN_COLOR;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const {order} = useOrders()

  const handleAcceptOrder = (orderId: number) => {
    // setOrders(prev => prev.filter(order => order.id !== orderId));
    console.log('Aceitou o pedido: ', orderId)
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: isOnline ? MAIN_COLOR : '#7f8c8d' }]}>
          <View>
            <Text style={styles.welcomeText}>Olá, Thiago!</Text>
            <Text style={styles.statusText}>{isOnline ? 'Você está Online' : 'Você está Offline'}</Text>
          </View>
          <Switch 
            value={isOnline} 
            onValueChange={setIsOnline} 
            trackColor={{ false: "#bdc3c7", true: "#fff" }} 
          />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Pedidos próximos</Text>
          
          {isOnline && order?.map(order => (
            <SwipeableOrderCard key={order.id} order={order} onAccept={handleAcceptOrder} />
          ))}

          {!isOnline && (
            <View style={styles.offlineWarning}>
              <MaterialCommunityIcons name="moped-electric" size={60} color="#bdc3c7" />
              <Text style={styles.offlineText}>Fique online para receber!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}


const SwipeableOrderCard = ({ order, onAccept }: any) => {
  var total_price = 0
  
  order.orderItems.forEach((item:any) => {
    total_price += item.price
  });
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withTiming(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, 
          { duration: 200 }, 
          () => {
            runOnJS(onAccept)(order.id);
          }
        );
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: 1 - Math.abs(translateX.value) / SCREEN_WIDTH,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      ['#2ecc71', 'transparent', '#2ecc71']
    ),
  }));

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.acceptBackground, backgroundAnimatedStyle]}>
        <MaterialCommunityIcons name="check-circle-outline" size={30} color="#fff" style={{ marginHorizontal: 20 }} />
        <MaterialCommunityIcons name="check-circle-outline" size={30} color="#fff" style={{ marginHorizontal: 20 }} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.orderCard, animatedStyle]}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Pedido #{order.id}</Text>
            <Text style={styles.deliveryPrice}>R$ {String(total_price.toFixed(2)).replace('.',',')}</Text>
          </View>
          
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="store" size={18} color={MAIN_COLOR} />
            <Text style={styles.addressText}>{order.store}</Text>
          </View>

          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="red" />
            <Text style={styles.addressText}>{order.dest}</Text>
          </View>
          
          <Text style={styles.swipeHint}>Arraste para aceitar</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  offlineWarning: {
    alignItems: 'center',
    marginTop: 50,
    opacity: 0.6,
  },
  offlineText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    borderLeftWidth: 5,
    borderLeftColor: MAIN_COLOR,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  acceptBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: -1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MAIN_COLOR,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 10,
    color: '#555',
    fontSize: 13,
    flex: 1,
  },
  swipeHint: {
    fontSize: 11,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});