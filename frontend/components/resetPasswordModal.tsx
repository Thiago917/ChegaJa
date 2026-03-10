import React, { useEffect, useState } from 'react'
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert, Touchable, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '@/services/api'

type Props = {
  visible: boolean
  onClose: () => void
  mail: string
}

export default function ResetPasswordModal({ visible, onClose, mail }: Props) {

  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState<string>(mail || '')
  const [code, setCode] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false);
  const [edited, setEdited] = useState<boolean>(false);
  const [pass, setPass] = useState<string>('');
  const [pass2, setPass2] = useState<string>('');
  const [eqPass, setEqPass] = useState<boolean>(true);  
  const [edit, setEdit] = useState<boolean>(false);
  const [passView, setPassView] = useState<boolean>(true)
  const [passView2, setPassView2] = useState<boolean>(true)

  useEffect(() => {
    if(visible && !edited) setEmail(mail)
  }, [visible])

  const showPass = () => {
    setPassView(!passView)
  }

  const showPass2 = () => {
    setPassView2(!passView2)
  }

  useEffect(() => {
    if(visible && pass2.length > 0){
      setEqPass(pass === pass2);
    }
  }, [visible, pass, pass2]);


  const sendCode = async () => {
    try {
      if(email === ''){
        Alert.alert('Insira o email onde quer receber o código')
        setLoading(false)
        return;
      }
      const send_mail = await api.post('/change-password-code', { mail: email })
      const res = send_mail.data
      if(res.error){
        Alert.alert('Erro', res.message)
        setLoading(false)
        return;
      }
      setLoading(false)
      setStep('code')
    } catch(err) {
      Alert.alert('Erro', `Erro ao enviar código para o email: ${err}`)
      setLoading(false)
      return;
    }
  }

  const verifyCode = async () => {
    try {

      if(code === ''){
        Alert.alert('Erro', 'Insira o código para validação')
        setLoading(false)
        return;
      }

      const response = await api.post('/verify-reset-code', { code: code })
      const res = response.data

      if(res.error){
        Alert.alert('Erro', res.message)
        setLoading(false)
        return;
      }
        
      setLoading(false)
      setStep('password')
    } catch {

      Alert.alert('Código inválido')
      setLoading(false)
      return;
    }
  }

  const changePassword = async () => {
    try {
      const response = await api.post('/reset-password', {email: email, newPass: pass})
      const res = response.data
      
      if(res.error){
        Alert.alert('Erro', res.message)
        setLoading(false)
        return;
      }

      setLoading(false)
      Alert.alert('Sucesso', 'Senha alterada com sucesso')
      
      onClose()
      resetState()
    } catch (err){
      Alert.alert('Erro', `${err}`)
      setLoading(false)
      return;
    }
  }

  const resetState = () => {
    setStep('email')
  }

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Ionicons name='close' size={30} color={'red'} onPress={() => { onClose(); resetState() }} style={{position: 'absolute', left: '100%', top: '5%'}}/>

          {step === 'email' && (
            <>

              <View style={styles.inputBox}>
                <Text style={styles.inputSpan}>Email de recuperação</Text>
                <View style={styles.inputGroup}>
                  <TextInput keyboardType='email-address' style={styles.input} value={email} onChangeText={(text) => {
                    setEmail(text)
                    setEdited(true)
                  }} placeholder='Insira o email de recuperação' placeholderTextColor={'gray'}></TextInput>
                  <Ionicons name='mail-outline' size={20} style={{right: '9%'}}/>
                </View>
              </View>
              <TouchableOpacity style={styles.btn} onPress={() => {
                setLoading(true)
                sendCode()
              }}>
                {loading ? (
                  <ActivityIndicator color={'white'}/>
                ):(
                  <Text style={styles.btnTxt}>Enviar código</Text>
                )}  
              </TouchableOpacity> 
            </>
          )}

          {step === 'code' && (
            <>

              <View style={styles.inputBox}>
                <Text style={styles.inputSpan}>Código</Text>
                <View style={styles.inputGroup}>
                  <TextInput keyboardType='number-pad' style={styles.input} onChangeText={setCode} placeholder='Insira o código de verificação'  placeholderTextColor={'gray'}></TextInput>
                  <Ionicons name='bookmark-outline' size={20} style={{right: '9%'}}/>
                </View>
                <Text style={{fontSize: 10, color: 'gray'}}>Seu código expira em 10 minutos</Text>
              </View>
              <TouchableOpacity style={styles.btn} onPress={() => {
                setLoading(true)
                setTimeout(() => {
                  verifyCode()
                }, 1000)
                }}>
                {loading? (
                  <ActivityIndicator color={'white'}/>
                ) : (
                  <Text style={styles.btnTxt}>Validar código</Text>
                )}  
              </TouchableOpacity> 

              <Text style={{paddingTop: 20, color: process.env.EXPO_PUBLIC_MAIN_COLOR, textDecorationLine:'underline'}} onPress={() => {
                setLoading(true)
                setCode('')
                sendCode()
              }}>Reenviar código</Text>
            </>
          )}

          {step === 'password' && (
            <>
              <View style={[styles.inputBox, {paddingTop: 20}]}>
                <Text style={styles.inputSpan}>Senha</Text>

                <View style={styles.inputGroup}>
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
                </View>
                {pass.length >= 6 ? <></> : <Text style={styles.passRules}>° Mínimo de 6 dígitos</Text>}
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputSpan}>Confirme a Senha</Text>
                
                <View style={styles.inputGroup}>
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

              <TouchableOpacity style={styles.btn} onPress={() => {
                  setLoading(true)
                  changePassword()
                }}>
                {loading ? (
                  <ActivityIndicator color={'white'}/>
                ):(
                  <Text style={styles.btnTxt}>Alterar a senha</Text>
                )}  
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#00000080'
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    gap: 20
  },
  inputBox:{
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  inputContainer:{
    width: '80%',
    gap: 20,
  },
  inputGroup:{
    flexDirection: 'row',
    alignItems: 'center',
  },
  input:{
    borderRadius: 5,
    borderColor: '#00000021',
    borderWidth: 1,
    width: '100%',
    paddingLeft: 10,
    color: '#000'
  },
  inputSpan:{
    fontWeight: 'bold',
    paddingLeft: 2
  },
  btn:{
    padding: 10,
    backgroundColor: process.env.EXPO_PUBLIC_MAIN_COLOR,
    borderRadius: 5
  },
  btnTxt:{
    color: 'ghostwhite',
    textAlign: 'center'
  },
  passRules:{
    fontSize: 11,
    color: 'gray'
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
})