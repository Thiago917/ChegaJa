import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { PhotoProvider } from "@/contexts/PhotoContext";
import { UserProvider } from "@/contexts/UserContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { MenuProvider } from "@/contexts/MenuContext";
import { NearShopsProvider } from '@/contexts/nearShopsContext'
import { StatusBar } from "expo-status-bar";

export default function TabNavigation(){

    const ordersAmount = 0

    return(
        <UserProvider>
            <StatusBar style="dark" />
            <PhotoProvider>
                <ShopProvider>
                    <NearShopsProvider>
                        <MenuProvider>
                            
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
                        </MenuProvider>
                    </NearShopsProvider>
                </ShopProvider>
           </PhotoProvider>
        </UserProvider>
    )
}