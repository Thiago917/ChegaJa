import { PhotoProvider } from "@/contexts/PhotoContext";
import { Stack } from "expo-router";

export default function ProfileLayout(){
    return(
        <Stack>
            <Stack.Screen name='index' options={{title: 'Perfil', headerShown: false}}/>
            <Stack.Screen name='edit-profile' options={{title: 'Editar perfil', headerTitle: 'Editar'}}/>
        </Stack>
    )
}