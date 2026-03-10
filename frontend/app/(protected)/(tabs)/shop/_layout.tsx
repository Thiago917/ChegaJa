import { Stack } from "expo-router";

export default function ShopLayout(){
    return(
        <Stack>
            <Stack.Screen name='index' options={{title: 'Loja', headerShown: false}}/>
            <Stack.Screen name='menu' options={{title: 'Cardápio', headerTitle: 'Cardápio'}}/>
        </Stack>
    )
}