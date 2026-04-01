import { Stack } from "expo-router";

export default function DriverLayout(){
  return(
    <Stack>
      <Stack.Screen name='index' options={{headerShown: false}}/>
      <Stack.Screen name='delivery' options={{title: 'Coleta / Entrega', headerTitleAlign: 'center'}}/>
    </Stack>
  )
}