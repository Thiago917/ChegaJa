import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { CartProvider } from "@/contexts/CartContext";
import { UserProvider } from "@/contexts/UserContext";
import { AddressProvider } from "@/contexts/AddressContext";
import { StripeProvider } from '@stripe/stripe-react-native'
import { Screen } from "expo-router/build/views/Screen";
import { MyOrdersProvider } from "@/contexts/MyOrdersContext";
import { DeliveryProvider } from "@/contexts/DeliveryContext";



export default function ProtectedLayout(){
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const checkAuth = async () =>{
            const token = await AsyncStorage.getItem('@accessToken');

            if(!token){
                router.replace('/login/login')
                return;
            }
            setLoading(false)
        }

        checkAuth();
    })
    if(loading){
        return(
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size='large'></ActivityIndicator>
            </View>
        )
    }

    return(
        <UserProvider>
            <StatusBar style="dark" />
            <CartProvider>
                <AddressProvider>
                    <StripeProvider publishableKey={`${process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLED_KEY}`} merchantIdentifier="merchant.com.chegaja">
                        <DeliveryProvider>
                            <MyOrdersProvider>
                                <Stack screenOptions={{headerShown: false}}>
                                    <Screen name='address/address'/>
                                </Stack>
                        </MyOrdersProvider>
                        </DeliveryProvider>
                    </StripeProvider>
                </AddressProvider>
            </CartProvider>
        </UserProvider>
    )
}