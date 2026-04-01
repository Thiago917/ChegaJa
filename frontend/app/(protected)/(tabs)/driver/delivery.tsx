import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useLocalSearchParams, useUnstableGlobalHref } from 'expo-router';
import * as Location from 'expo-location'
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PickupVerificationModal from '@/components/pickupModal';
import { useUser } from '@/contexts/UserContext';

type Coords = {
    latitude: number;
    longitude: number;
}

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#ff8c00';
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_API_GOOGLE_MAPS_SECKEY; 

export default function PickupMap() {

    const [driverLocation, setDriverLocation] = useState<Coords | null>(null);
    const [visible, setVisible] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    
    const mapRef = useRef<MapView>(null)
    
    const { orderId } = useLocalSearchParams();
    const { setDeliveries, deliveries } = useDelivery();
    const { user } = useUser();

    const delivery = deliveries.filter((item) => item.id === Number(orderId))[0]


    useEffect(() => {
        let subscription: Location.LocationSubscription;

        const watchPosition = async () => {
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10,
                    timeInterval: 5000
                },
                (location) => {
                    const {latitude, longitude} = location.coords
                    
                    const newCoords = {latitude, longitude}
                    setDriverLocation(newCoords)

                    // Se a entrega e a localização da loja estiverem disponíveis, ajuste para mostrar ambos
                    if (mapRef.current && delivery && delivery.shop) {
                        mapRef.current.fitToCoordinates(
                            [
                                newCoords,
                                { latitude: Number(delivery.shop.latitude), longitude: Number(delivery.shop.longitude) }
                            ],
                            {
                                edgePadding: { top: 100, right: 50, bottom: 200, left: 50 }, // Ajuste o padding para evitar a caixa de informações
                                animated: true,
                            }
                        );
                    } else if (mapRef.current) {
                        // Caso contrário, apenas centralize no motorista
                        mapRef.current.animateCamera({
                            center: newCoords,
                            pitch: 0,
                            heading: 0,
                            altitude: 1000,
                            zoom: 16
                        });
                    }
                }
            );
        }

        watchPosition();

        return () => { if (subscription) subscription.remove(); };
    }, [delivery]); 

    const handleArrived = async () => {
        await setDeliveries(Number(orderId), { status: 'shipped' });

    };

    if (!delivery) {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <ActivityIndicator color={MAIN_COLOR}/>
                <Text style={{ marginTop: 50, textAlign: 'center' }}>Carregando dados da entrega...</Text>
            </View>
        );
    }
    
    const user_data = {
        ...delivery?.user,
        distance_destin: delivery?.distance_destin,       
        lat: delivery.user.Addresses[0].latitude,
        lng: delivery.user.Addresses[0].longitude
    };

    return (
        <View style={styles.container}>
            <MapView 
                ref={mapRef} 
                provider={PROVIDER_GOOGLE} 
                style={styles.map}
                initialRegion={driverLocation ? {
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }: undefined}>

                {driverLocation && delivery.status === 'collecting' ? (

                    <>
                        {/* Marcador do Motoboy */}
                        <Marker 
                            coordinate={{ 
                                latitude: Number(driverLocation.latitude), 
                                longitude: Number(driverLocation.longitude) 
                            }}
                            title='Você está aqui'
                            style={{width: 30, height: 30, alignItems: 'center', justifyContent: 'center'}}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.markerContainer}>
                                <FontAwesome name='motorcycle' size={22} color={'#2e4b7d'}/>
                            </View>
                        </Marker>

                        {/* Marcador da Loja */}
                        <Marker 
                            coordinate={{ 
                                latitude: Number(delivery.shop.latitude), 
                                longitude: Number(delivery.shop.longitude) 
                            }}
                            title='Loja'
                            anchor={{ x: 0.5, y: 0.5 }}
                            style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <View style={styles.markerContainer}>
                                <Ionicons name='storefront' size={22} color={'#2E7D32'}/>
                            </View>
                        </Marker>
                    </>
                ): driverLocation && (
                    <>
                        {/* Marcador do Motoboy */}
                        <Marker 
                            coordinate={{ 
                                latitude: Number(delivery.shop.latitude), 
                                longitude: Number(delivery.shop.longitude) 
                            }}
                            title='Você está aqui'
                            style={{width: 30, height: 30, alignItems: 'center', justifyContent: 'center'}}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.markerContainer}>
                                <FontAwesome name='motorcycle' size={22} color={'#2e4b7d'}/>
                            </View>
                        </Marker>

                        {/* Marcador do Cliente */}
                        <Marker 
                            coordinate={{ 
                                latitude: Number(user_data.lat), 
                                longitude: Number(user_data.lng) 
                            }}
                            title='Cliente'
                            anchor={{ x: 0.5, y: 0.5 }}
                            style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <View style={styles.markerContainer}>
                                <Ionicons name='person-circle' size={22} color={'#2E7D32'}/>
                            </View>
                        </Marker>
                    </>
                )}

                {delivery && delivery.status === 'collecting' ? (

                    <MapViewDirections
                        origin={{ latitude: Number(driverLocation?.latitude), longitude: Number(driverLocation?.longitude) }}
                        destination={{ latitude: Number(delivery?.shop?.latitude), longitude: Number(delivery?.shop?.longitude) }}
                        apikey={String(GOOGLE_MAPS_APIKEY)}
                        strokeWidth={4}
                        strokeColor={MAIN_COLOR}
                        onReady={(result) => {
                            mapRef.current?.fitToCoordinates(result.coordinates, { 
                                edgePadding: {top: 50, right: 50, bottom: 50, left: 50}
                            })
                        }}
                    />
                ):(
                    <MapViewDirections
                        origin={{ latitude: Number(delivery?.shop?.latitude), longitude: Number(delivery?.shop?.longitude) }}
                        destination={{ latitude: user_data.lat, longitude: user_data.lng }}
                        apikey={String(GOOGLE_MAPS_APIKEY)}
                        strokeWidth={4}
                        strokeColor={MAIN_COLOR}
                        onReady={(result) => {
                            mapRef.current?.fitToCoordinates(result.coordinates, { 
                                edgePadding: {top: 50, right: 50, bottom: 50, left: 50}
                            })
                        }}
                    />   
                )
            }
                
            </MapView>


                {delivery.status === 'collecting' ? (
                    <View style={styles.infoBox}>
                        <View style={styles.dragIndicator} />
                        
                        <View style={styles.headerRow}>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>EM COLETA</Text>
                            </View>
                            <Text style={styles.orderId}>Pedido: {`# ${delivery?.id}`}</Text>
                        </View>

                        <View style={styles.shopDetails}>
                            <Text style={styles.label}>RETIRADA EM</Text>
                            <Text style={styles.shopName}>{delivery?.shop?.name}</Text>
                            
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="map-marker-distance" size={18} color="#666" />
                                    <Text style={styles.statText}>{delivery?.distance_origin?.distance}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
                                    <Text style={styles.statText}>{delivery?.distance_origin?.time} min</Text>
                                </View>
                            </View>
                        </View>
                        

                        <TouchableOpacity style={styles.btnArrived} activeOpacity={0.8} onPress={() => {
                            setLoading(true)
                            setTimeout(() => {
                                setVisible(true)
                                setLoading(false)
                            }, 700)
                        }}>
                            {loading ? (
                                <ActivityIndicator color={'#fff'} />
                            ) : 
                            (
                                <>
                                    <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
                                    <Text style={styles.btnText}>CHEGUEI NA LOJA</Text>
                                </>
                            )}
                                
                        </TouchableOpacity>

                        {visible && (
                            <PickupVerificationModal isVisible={visible} onClose={() => setVisible(false)} onVerify={handleArrived} orderId={Number(orderId)} pushToken={String(user?.pushToken)} status={delivery.status}/>
                        )}
                    </View>

                ) : (
                    <View style={styles.infoBox}>
                        <View style={styles.dragIndicator} />
                        
                        <View style={styles.headerRow}>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>EM ROTA DE ENTREGA</Text>
                            </View>
                            <Text style={styles.orderId}>Pedido: {`# ${delivery?.id}`}</Text>
                        </View>

                        <View style={styles.shopDetails}>
                            <Text style={styles.label}>ENTREGA EM</Text>
                            <Text style={styles.shopName}>{user_data.Addresses[0].logradouro}, {user_data.Addresses[0].numero} </Text>
                            
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="map-marker-distance" size={18} color="#666" />
                                    <Text style={styles.statText}>{user_data.distance_destin?.distance}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
                                    <Text style={styles.statText}>{user_data.distance_destin?.time} min</Text>
                                </View>
                            </View>
                        </View>
                        

                        <TouchableOpacity style={styles.btnArrived} activeOpacity={0.8} onPress={() => {
                            setLoading(true)
                            setTimeout(() => {
                                setVisible(true)
                                setLoading(false)
                            }, 700)
                        }}>
                            {loading ? (
                                <ActivityIndicator color={'#fff'} />
                            ) : 
                            (
                                <>
                                    <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
                                    <Text style={styles.btnText}>FINALIZAR ENTREGA</Text>
                                </>
                            )}
                                
                        </TouchableOpacity>

                        {visible && (
                            <PickupVerificationModal isVisible={visible} onClose={() => setVisible(false)} onVerify={handleArrived} orderId={Number(orderId)} pushToken={String(user?.pushToken)} status={delivery.status}/>
                        )}
                    </View>
                    
                )}
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject 
    },
    map: {
        ...StyleSheet.absoluteFillObject 
    },
    infoBox: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#EEE',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 5,
    },
    statusText: {
        color: '#1976D2',
        fontSize: 10,
        fontWeight: 'bold',
    },
    orderId: {
        color: '#999',
        fontSize: 12,
        fontWeight: '600',
    },
    shopDetails: {
        marginBottom: 20,
    },
    label: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    shopName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    markerWrapper: {
        width: 60, 
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        zIndex: 20, // Garante que fique acima da linha da rota
    },
    markerContainer: {
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 0,
        shadowOpacity: 0,
        overflow: 'hidden', 
    },
    btnArrived: { 
        backgroundColor: MAIN_COLOR, 
        height: 55,
        borderRadius: 12, 
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    btnText: { 
        color: 'white', 
        fontWeight: 'bold',
        fontSize: 16,
    }
});