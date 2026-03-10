import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import axios from 'axios';

export default function Splash() {
  const api_url = process.env.EXPO_PUBLIC_API_URL
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('@refreshToken');
        if(!token){
          router.replace('/login/login')
        }        
          try{
            await axios.post(`${api_url}/refreshToken`,{token}, {
              headers:{
                'Authorization': `Bearer ${token}`
              }
            }).then(async (response) => {
              const res = response.data 
              if(res.error){
                setTimeout(() => {
                  router.replace('/login/login')
                  return;
                }, 1500)
              }
              try{
                await AsyncStorage.multiSet([
                  ['@accessToken', res.accessToken],
                  ['@refreshToken', res.refreshToken],
                  ['@userName', res.name]
                ])
                setTimeout(() => {
                  router.replace('./home')
                }, 1500)
              }
              catch(error){
                console.log('Erro na adição dos itens do AsyncStorage')
                AsyncStorage.setItem('@biometry', 'false');
              }
            })
          }
          catch(err){
            console.log(`Erro ao usar a rota refreshToken: ${err}`)
            setTimeout(() => {
              router.replace('/login/login')
            }, 1500)
          }
      } catch (err) {
        console.error('Erro ao verificar token', err);
        setTimeout(() => {
          router.replace('/login/login');
        }, 1500)
      }
    };

    checkToken();
  },[]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/chegaja-foreground.png')} style={styles.imageLoading} resizeMode='contain'/>      
      <ActivityIndicator size="large" color="#000" />
      <Text>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    alignItems: 'center',
  },
  imageLoading:{
    width: '80%'
  }
})