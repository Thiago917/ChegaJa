import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { UserProvider } from "@/contexts/UserContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { NearShopsProvider } from '@/contexts/nearShopsContext'
import { StatusBar } from "expo-status-bar";
import * as Notifications from 'expo-notifications'
import { Platform } from "react-native";
import { useEffect, useMemo } from "react";
import { MyOrdersProvider, useOrders } from "@/contexts/MyOrdersContext";
import { DeliveryProvider } from "@/contexts/DeliveryContext";


export default function TabNavigation(){

    const {order} = useOrders()

    const activeOrders = useMemo(() => 
        order?.filter(o => ['paid'].includes(o.status)) || [], 
    [order]);
    
    const deliveryOrders = useMemo(() => 
        order?.filter(o => ['preparing'].includes(o.status)) || [], 
    [order]);

    const ordersAmount = activeOrders?.length || 0
    const deliveries = deliveryOrders?.length || 0


    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowList: true,
            }),
        });

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
    }, []); 

    return(
        <UserProvider>
            <StatusBar style="dark" />
            <ShopProvider>
                <NearShopsProvider>
                    <Tabs screenOptions={{
                        headerShown:false,
                        tabBarActiveTintColor: '#ff8c00'
                    }}>
                        <Tabs.Screen
                            name="home"
                            options={{
                                title: "Home",
                                tabBarIcon: ({ color, size }) => (
                                    <Ionicons name="home" size={size} color={color} />
                                ),
                            }}
                        />
                        <Tabs.Screen 
                            name='orders' 
                            options={{
                                title: 'Pedidos',
                                tabBarIcon: ({color, size}) => (
                                    <Ionicons name='file-tray' size={size} color={color}></Ionicons>
                                )
                            }}
                        />
                        <Tabs.Screen 
                            name='profile' 
                            options={{
                                title: 'Perfil',
                                tabBarIcon: ({color, size}) => (
                                    <Ionicons name='person-outline' size={size} color={color}></Ionicons>
                                )
                            }}
                        />
                        <Tabs.Screen 
                            name='shop' 
                            options={{
                                title: 'Lojista',
                                tabBarBadge: ordersAmount > 0 ? ordersAmount : undefined,
                                tabBarBadgeStyle:{backgroundColor: process.env.EXPO_PUBLIC_MAIN_COLOR},
                                tabBarIcon: ({color, size}) => (
                                    <FontAwesome name='shopping-basket' size={size} color={color} />
                                )
                            }}
                        />
                        <Tabs.Screen 
                            name='driver' 
                            options={{
                                title: 'Entregador',
                                tabBarBadge: deliveries > 0 ? deliveries : undefined,
                                tabBarBadgeStyle:{backgroundColor: process.env.EXPO_PUBLIC_MAIN_COLOR},
                                tabBarIcon: ({color}) => (
                                    <FontAwesome name='motorcycle' size={23} color={color} />
                                )
                            }}
                        />
                    </Tabs>
                </NearShopsProvider>
            </ShopProvider>
        </UserProvider>
    )
}