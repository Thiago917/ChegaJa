import { MenuProvider } from "@/contexts/MenuContext";
import { Stack } from "expo-router";

export default function ShopLayout(){
    return(
        <MenuProvider> 
            <Stack>
                <Stack.Screen name='index' options={{title: 'Loja', headerShown: false}}/>
                <Stack.Screen name='menu' options={{title: 'Cardápio', headerTitle: 'Cardápio'}}/>
            </Stack>
        </MenuProvider>
    )
}