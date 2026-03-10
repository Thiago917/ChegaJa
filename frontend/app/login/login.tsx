import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import CheckBox from 'expo-checkbox';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuth from 'expo-local-authentication'
import { ScrollView } from "react-native";
import api from "@/services/api";
import ResetPasswordModal from "@/components/resetPasswordModal";

export default function Index() {

  const [passView, setPassView] = useState<boolean>(true)
  const [mail, setMail] = useState<string>('');
  const [pass, setPass] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false)
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [enabled, setEnabled] = useState<boolean>(false)
  const [biometry, setBiometry] = useState<boolean>(false)
  const [modal, setModal] = useState<boolean>(false)

  useEffect(() => {
    checkFingerPrint();
    if(biometry){
      checkLogin()
      setBiometry(true)
    } 
  }, [])  

  const checkFingerPrint = async () => {
    const enabled = await AsyncStorage.getItem('@biometry')
    if(enabled === 'true'){
      setEnabled(true)
      return enabled
      }
    else setEnabled(false)
  }

  const checkLogin = async () => {
    
    try{
      const token = await AsyncStorage.getItem('@refreshToken');
      const fingerPrintEnabled = await AsyncStorage.getItem('@biometry');
      if(fingerPrintEnabled === 'true' && token) {
        setLoading(true)
        
        const verifyFP = await auth();
        if(verifyFP?.error && verifyFP?.error_description === 'user_cancel') {
          setLoading(false)
          return;
        };
        if(verifyFP?.error && verifyFP?.error_description === 'lockout'){
          Alert.alert('Erro', 'Biometria bloqueada!')
          setLoading(false)
          return;
        }

        try{
          const response = await api.post('/refreshToken')
          const res = response.data

          if(res.error){
            setLoading(false)
            return;
          };

          await AsyncStorage.multiSet([
            ['@accessToken', res.accessToken],
            ['@refreshToken', res.refreshToken]
          ])
          setLoading(false)
          router.push('/(protected)/(tabs)/home')
        }
        catch(err){
          console.log('erro na autenticação com biometria: ', err)
          setLoading(false)
        }
        finally{
          setLoading(false)
        }
      }
    }
    catch(err){
      console.log('Erro: ',err)
    }

  }

  const auth = async () => {

    try{

      const compatible = await LocalAuth.hasHardwareAsync();
      if(!compatible){
        console.log('dispositivo não suporta biometria')
        return;
      } 
      
      const enrroled = await LocalAuth.isEnrolledAsync()
      if(!enrroled) {
        console.log('Nenhuma biometria cadastrada');
        return
      }

      const final = await LocalAuth.authenticateAsync({
        promptMessage: 'Use a digital para entrar',
        fallbackLabel: 'Usar senha'
      })

      if(final.success) return {sucess: true, error: false}
      else return {sucess: false, error: true, error_description: final.error}
      
      
    }
    catch(err){
      console.log('Erro na biometria: ',err)
      return null
    }
  }

  const showPass = () => {
    setPassView(!passView)
  }

  const login = async () => {
    setLoading(true)
    if(!mail || !pass){
      Alert.alert('Erro', 'Email ou senha está vazio...')
      setLoading(false)
      return;
    }

    const data = {
      email: mail,
      senha: pass
    }

    try{
      await api.post('/login', data).then(async (response) => {

        const res = response.data
        switch(res.error){
          case true:
            Alert.alert('Erro', String(res.message))
            setLoading(false)
            break;
          case false:{
            await AsyncStorage.multiSet([
                ['@accessToken', res.accessToken],
                ['@refreshToken', res.refreshToken],
                ['@biometry', isChecked ? 'true' : 'false'],
                ['@username', res.name],
                ['@userPhoto', res.photo]
              ])
              router.push('/(protected)/(tabs)/home')
          }
        }
      })
    }
    catch(err){
      console.log(err)
      setLoading(false)
    }
  }

  if(loading){
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
        <Link href='/login/login'><Text>Carregando...</Text></Link>
      </View>
    );
  }

  return (

    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>

        <View style={styles.container}>
          <View style={styles.logoBox}>
            <Text style={styles.logo}>Chega Já!</Text>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputBox}>

              <View style={styles.inputGroup}>
                <Text style={styles.inputSpan}>Email</Text>
                <TextInput placeholder="Insira seu email" keyboardType='email-address' style={styles.input} placeholderTextColor={'gray'} value={mail} onChangeText={(text) => setMail(text)}></TextInput>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputSpan}>Senha</Text>
                <View style={styles.pass}>
                  <TextInput placeholder="Insira sua senha" secureTextEntry={passView} style={styles.input} placeholderTextColor={'gray'} value={pass} onChangeText={(text) => setPass(text)}/>
                  <TouchableOpacity style={styles.showPassBtn} onPress={showPass}>
                    <Ionicons
                      name={passView ? "eye" : "eye-off"}
                      size={22}
                      color="gray"
                    />
                  </TouchableOpacity>
                </View>
                <ResetPasswordModal visible={modal} onClose={() => setModal(false)} mail={mail}/>

                <Text style={{paddingTop: 20, left: 3, color: process.env.EXPO_PUBLIC_MAIN_COLOR, textDecorationLine:'underline'}} onPress={() => setModal(true)}>Esqueceu sua senha?</Text>
              </View>
              
                {!enabled ? (
                  <View style={{flexDirection: 'row', gap: 5, alignItems: 'center', paddingLeft: 5}}>
                    <CheckBox value={isChecked} onValueChange={() => setIsChecked(!isChecked)}/>
                    <Text>Entrar próxima vez com digital</Text>
                  </View>

                ) : <>
                </>}
            </View>

            <View style={styles.btnContainer}>
              <TouchableOpacity style={styles.btn} onPress={() => {
                setLoading(true)
                login()
              }} disabled={loading}>
                {loading? (
                        <ActivityIndicator color={'#fff'} />
                      ):(
                        <Text style={{fontWeight: 'bold', color: 'ghostwhite', letterSpacing: 1, textTransform: 'uppercase'}}>Entrar</Text>
                  )
              }
              </TouchableOpacity>
              {enabled ? (
                <View style={{alignItems: 'center', marginTop: 20}}>
                <TouchableOpacity onPress={checkLogin} style={{width: 60, height: 60, borderRadius: 30, backgroundColor: '#ffa23120',justifyContent: 'center', alignItems: 'center'}}>
                  <Ionicons name="finger-print" size={28} color={process.env.EXPO_PUBLIC_MAIN_COLOR} />
                </TouchableOpacity>

                <Text style={{ marginTop: 8, color: '#666' }}>
                  Usar digital
                </Text>
              </View>
              ) : (<></>)}
            </View>

            <View style={styles.footer}>

              <View style={styles.homeLink}>
                <Link href='../cadastro/cadastro' style={{color: process.env.EXPO_PUBLIC_MAIN_COLOR, fontWeight: 'bold'}}>Ainda não tenho uma conta!</Link>
              </View>
              
              <View>
                <Text style={{color: '#0000002c'}}>Thiago Lima Maximiano @2026</Text>
              </View>

            </View>
          
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  logo:{
    fontSize: 30,
    fontFamily: 'Horizon', 
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#df7b00bc',
    textShadowRadius: 15,
    color: process.env.EXPO_PUBLIC_MAIN_COLOR
  }, 
  logoBox:{
    marginBottom: 150
  },
  formContainer:{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 120,
    width: '80%',
  },
  inputBox:{
    display: 'flex',
    flexDirection: 'column',
    gap: 40
  },
  input:{
    borderRadius: 5,
    borderColor: '#00000021',
    borderWidth: 1,
    width: '100%',
    paddingLeft: 10,
    color: '#000'
  },
  pass:{
    display: 'flex',
    flexDirection: 'row'
  },
  showPassBtn:{
    position: 'absolute',
    top: 8,
    left: '90%'
  },
  inputGroup:{
    display: 'flex',
    flexDirection: 'column',
    gap: 5
  },
  inputSpan:{
    fontWeight: 'bold'
  },
  btnContainer:{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%',
  },
  btn:{
    width: '100%',
    padding: 10,
    backgroundColor: '#ffa231',
    borderRadius: 5,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer:{
    display: 'flex',
    gap: 60
  },
  homeLink:{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fpBtn:{
    width: '45%',
    padding: 10,
    backgroundColor: '#ffa231',
    borderRadius: 5,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
})