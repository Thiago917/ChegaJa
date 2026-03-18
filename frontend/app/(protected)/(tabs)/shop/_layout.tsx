import { MenuProvider } from "@/contexts/MenuContext";
import { Stack } from "expo-router";

export default function ShopLayout(){
    return(
        <Stack>
            <MenuProvider>
                <Stack.Screen name='index' options={{title: 'Loja', headerShown: false}}/>
                <Stack.Screen name='menu' options={{title: 'Cardápio', headerTitle: 'Cardápio'}}/>
            </MenuProvider>
        </Stack>
    )
}