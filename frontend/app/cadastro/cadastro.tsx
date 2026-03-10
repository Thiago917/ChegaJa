import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from "@/services/api";

export default function Cadastro(){
    
    const [passView, setPassView] = useState<boolean>(true)
    const [passView2, setPassView2] = useState<boolean>(true)
    const [name, setName] = useState<string>('');
    const [mail, setMail] = useState<string>('');
    const [pass, setPass] = useState<string>('');
    const [pass2, setPass2] = useState<string>('');
    const [eqPass, setEqPass] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [edit, setEdit] = useState<boolean>(false);
    
    const showPass = () => {
        setPassView(!passView)
    }

    const showPass2 = () => {
        setPassView2(!passView2)
    }

    useEffect(() => {
        if(pass2.length > 0){
            setEqPass(pass === pass2);
        }
    }, [pass, pass2]);

    const register = async () => {

        if(!name || !mail || !pass || !pass2){
            Alert.alert('Erro', 'Preencha todas as informações para se cadastrar');
            return;
        }
        setLoading(true)

        if(!eqPass){
            Alert.alert('Erro', 'As senhas são diferentes.')
            setLoading(false)
            return;
        }

        const data = {
            nome: name,
            email: mail,
            senha: pass
        }
        try{
            await api.post('/register', data).then((response) => {
                const res = response.data

                switch(res.error){
                    case true:{
                        Alert.alert('Erro', String(res.message))
                        setLoading(false)
                        break;
                    }
                    case false:{
                        Alert.alert('Sucesso!', String(res.message))
                        setTimeout(() => {
                            storageData(res.accessToken, res.refreshToken, res.name)
                        }, 500)
                    }
                }
            })
        }

        catch(err){
            console.log(err)
            setLoading(false)
        }

    }

    const storageData = async(accessToken: string, refreshToken: string, name: string) => {
        try{
            
            await AsyncStorage.multiSet([
                ['@accessToken', accessToken], 
                ['@refreshToken', refreshToken],
                ['@userName', name]
            ]);
            router.push('/(protected)/(tabs)/home')
        }
        catch(err){
            console.log('Erro ao salvar os dados localmente: ', err)
        }
    }

    return (

        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
            <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}} keyboardShouldPersistTaps={'always'}>
                <View style={styles.container}>
                <View style={styles.logoBox}>
                    <Text style={styles.logo}>Chega Já!</Text>
                </View>

                <View style={styles.formContainer}>
                    
                    <View style={styles.inputBox}>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputSpan}>Nome Completo</Text>
                        <TextInput placeholder="Insira seu nome completo" style={styles.input} value={name} placeholderTextColor={'gray'} onChangeText={(text) => setName(text)}></TextInput>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputSpan}>Email</Text>
                        <TextInput placeholder="Insira seu email" keyboardType='email-address' style={styles.input} value={mail} placeholderTextColor={'gray'} onChangeText={(text) => setMail(text)}></TextInput>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputSpan}>Senha</Text>
                        <View style={styles.pass}>
                        <TextInput placeholder="Insira sua senha" secureTextEntry={passView} style={styles.input} value={pass} placeholderTextColor={'gray'} onChangeText={(text) => {
                            setPass(text)
                            text.length < 6 ? setEdit(false) : setEdit(true)
                        }}/>
                        <TouchableOpacity style={styles.showPassBtn} onPress={showPass}>
                            <Ionicons
                            name={passView ? "eye" : "eye-off"}
                            size={22}
                            color="gray"
                            />
                        </TouchableOpacity>
                        </View>
                        {pass.length >= 6 ? <></> : <Text style={styles.passRules}>° Mínimo de 6 dígitos</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputSpan}>Confirme a Senha</Text>
                        <View style={styles.pass}>
                        {eqPass ? (
                            <TextInput placeholder="Insira sua senha novamente" secureTextEntry={passView2} style={styles.input} value={pass2} placeholderTextColor={'gray'} onChangeText={(text) => setPass2(text)} editable={edit}/>
                        ):(
                            <TextInput placeholder="Insira sua senha novamente" secureTextEntry={passView2} style={styles.inputWrong} value={pass2} placeholderTextColor={'gray'} onChangeText={(text) => setPass2(text)}/>
                        )}
                        <TouchableOpacity style={styles.showPassBtn} onPress={showPass2}>
                            <Ionicons
                            name={passView2 ? "eye" : "eye-off"}
                            size={22}
                            color="gray"
                            />
                        </TouchableOpacity>
                        </View>
                    </View>
                    </View>

                    <View style={styles.btnContainer}>
                        <TouchableOpacity style={styles.btn} onPress={register} disabled={loading}>
                            {loading? (
                                    <ActivityIndicator color={'#fff'} />
                                ):(
                                    <Text style={{fontWeight: 'bold', color: 'ghostwhite', letterSpacing: 1, textTransform: 'uppercase'}}>Registrar</Text>
                                )
                            }
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>

                    <View style={styles.homeLink}>
                        <Link href='../' style={{color: '#ff8c00', fontWeight: 'bold'}}>Já tenho uma conta!</Link>
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
    color: '#ff8c00'
  }, 
  logoBox:{
    marginBottom: 150
  },
  formContainer:{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 70,
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
  inputWrong:{
    borderRadius: 5,
    borderColor: '#ff00007e',
    borderWidth: 1,
    width: '100%',
    paddingLeft: 10
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
  passRules:{
    fontSize: 11,
    color: 'gray'
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
    gap: 20
  },
  homeLink:{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
})