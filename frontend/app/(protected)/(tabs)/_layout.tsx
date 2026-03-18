import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { UserProvider } from "@/contexts/UserContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { NearShopsProvider } from '@/contexts/nearShopsContext'
import { StatusBar } from "expo-status-bar";
import { MyOrdersProvider } from "@/contexts/MyOrdersContext";
import * as Notifications from 'expo-notifications'


export default function TabNavigation(){

    const ordersAmount = 0

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true, 
        }),
    });

    return(
        <UserProvider>
            <StatusBar style="dark" />
                <ShopProvider>
                    <NearShopsProvider>
                            <MyOrdersProvider>
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
                                </Tabs>
                            </MyOrdersProvider>
                    </NearShopsProvider>
                </ShopProvider>
        </UserProvider>
    )
}