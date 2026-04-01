import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Dimensions, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS, 
  interpolateColor, 
  Easing, 
  cancelAnimation
} from 'react-native-reanimated';
import { useDelivery } from '@/contexts/DeliveryContext';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import api from '@/services/api';
import FloatingDeliveryBubble from '@/components/floatingDeliveryBubble';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; 
const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [refreshing, setRefresing] = useState<boolean>(false);

  const { deliveries, handleTimeoutCard, loadDeliveries, setDeliveries, activeDelivery } = useDelivery();
  const {user} = useUser()

  const onRefresh = async () => {
    setRefresing(true)
    await loadDeliveries()
    setRefresing(false)
  }
  
  const handleAcceptOrder = async (orderId: number) => {

    try{

      const response = await api.post('/create-pickup', {
        orderId
      })

      const res = response.data

      if(res.error){
        Alert.alert('Erro', `${res.message}`)
        return;
      }

      await api.post('/send-notify', {
        title: 'Entregador foi encontrado',
        body: 'O entregador já está indo em direção da loja para coletar seu pedido, em instantes sua comida estará em suas mãos',
        token: user?.pushToken
      })

      router.push({
        pathname: "/(protected)/(tabs)/driver/delivery",
        params: { orderId }
      })

    }
    catch(err){
      console.log('Erro ao aceitar a entrega: ',err)
    }
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
            thumbColor={isOnline ? "#fff" : "#f4f3f4"}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content}
          refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea1d2c" />
          }>
          <Text style={styles.sectionTitle}>Pedidos próximos</Text>
          
          {isOnline && deliveries?.map(order => order.status === 'preparing' && (
            <SwipeableOrderCard 
              key={order.id} 
              order={order} 
              onAccept={handleAcceptOrder} 
              onTimeout={handleTimeoutCard} 
            />
          ))}

          {!isOnline && (
            <View style={styles.offlineWarning}>
              <MaterialCommunityIcons name="moped-electric" size={60} color="#bdc3c7" />
              <Text style={styles.offlineText}>Fique online para receber!</Text>
            </View>
          )}
        </ScrollView>
      </View>
      {activeDelivery && (
        <FloatingDeliveryBubble />
      )}
    </GestureHandlerRootView>

  );
}

const SwipeableOrderCard = ({ order, onAccept, onTimeout }: any) => {
  const progress = useSharedValue(1);
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  
  const cardOpacity = useSharedValue(1);
  const cardHeight = useSharedValue(230);

  const triggerFadeOutAndRemove = () => {
    cardOpacity.value = withTiming(0, { duration: 400 });
    cardHeight.value = withTiming(0, { 
      duration: 500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }, (finished) => {
      if (finished && onTimeout) {
        runOnJS(onTimeout)(order.id);
      }
    });
  };

  useEffect(() => {
    progress.value = withTiming(0, {
      duration: 15000,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(triggerFadeOutAndRemove)();
      }
    });
  }, []);

  const distance_origin = order.distance_origin.distance.split(' ')[1] === 'm' 
    ? order.distance_origin.distance.split(' ')[0] + ' Metros' 
    : order.distance_origin.distance;

  const distance_destin = order.distance_destin.distance.split(' ')[1] === 'm' 
    ? order.distance_destin.distance.split(' ')[0] + ' Metros' 
    : order.distance_destin.distance;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        
        cancelAnimation(progress);
        
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

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: cardOpacity.value * (1 - Math.abs(translateX.value) / SCREEN_WIDTH),
    height: cardHeight.value,
    marginBottom: cardHeight.value > 0 ? 15 : 0,
    overflow: 'hidden'
  }));

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: progress.value < 0.3 ? '#e74c3c' : '#f39c12' 
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      ['#2ecc71', 'transparent', '#2ecc71']
    ),
    opacity: cardOpacity.value
  }));

  return (
    <Animated.View style={[styles.swipeContainer, animatedCardStyle]}>
      <Animated.View style={[styles.acceptBackground, backgroundAnimatedStyle]}>
        <MaterialCommunityIcons name="check-circle-outline" size={30} color="#fff" style={{ marginHorizontal: 20 }} />
        <MaterialCommunityIcons name="check-circle-outline" size={30} color="#fff" style={{ marginHorizontal: 20 }} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Pedido #{order.id}</Text>
            <Text style={styles.deliveryPrice}>R$ {order.frete.toFixed(2).replace('.',',')}</Text>
          </View>
          
          <View style={styles.addressBox}>
            <Text style={styles.label}>Coleta:</Text>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="store" size={20} color={'green'} />
              <Text style={styles.addressText}>
                {order.origin} - <Text style={styles.distanceGreen}>{distance_origin}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.label}>Entrega:</Text>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="red" />
              <Text style={styles.addressText}>
                {order.destin} - <Text style={styles.distanceRed}>{distance_destin}</Text>
              </Text>
            </View>
          </View>
          
          <Text style={styles.swipeHint}>Arraste para aceitar</Text>

          <View style={styles.timerContainer}>
            <Animated.View style={[styles.timerBar, timerBarStyle]} />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
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
    height: '100%'
  },
  timerContainer: {
    height: 6,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 15,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 3
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
  label: {
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    fontSize: 10,
    color: '#7f8c8d'
  },
  addressBox:{
    flexDirection: 'column',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  addressText: {
    marginLeft: 10,
    color: '#555',
    fontSize: 12,
    flex: 1,
  },
  distanceGreen: {
    fontSize: 13, 
    fontWeight: 'bold', 
    color: 'green'
  },
  distanceRed: {
    fontSize: 13, 
    fontWeight: 'bold', 
    color: 'red'
  },
  swipeHint: {
    fontSize: 11,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
});