import { useUser } from "@/contexts/UserContext";
import ResetPasswordModal from "@/components/resetPasswordModal";
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from "@/services/uploadImages";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image } from 'expo-image';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImageManipulator from 'expo-image-manipulator'
import api from "@/services/api";

export default function editProfile(){


    const [loading, setLoading] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [modal, setModal] = useState<boolean>(false);
    const [txtLoading, setTxtLoading] = useState<boolean>(false);
    const [btnLoading, setBtnLoading] = useState<boolean>(false);
    const {user, setUser} = useUser();    

    const saveProfile = async () => {
        try{
            if(!user?.name || !user?.mail){
                setLoading(false)
                Alert.alert('Erro', 'Não é possível deixar os campos em branco')
                return;
            }

            await setUser(String(user?.id), {name: user?.name, mail: user?.mail})
            setLoading(false)
            setIsEditing(false)
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!')
        }
        catch(err){
            Alert.alert('Erro', `${err}`)
            setLoading(false)
            return;
        }
    }

    const compressPhoto = async (uri: string) => {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: {width: 800}}],
            {compress: 0.7, format: ImageManipulator.SaveFormat.JPEG}
        )

        return result.uri;
    }

    const pickImage = async () => {
        setTxtLoading(false)
        try{
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5
            });
            if(!result.canceled){
                setLoading(true)
                const uri = result.assets[0].uri

                const compressURI = await compressPhoto(uri);
                const imageUrl = await uploadImageAsync(compressURI, String(user?.id), 'profile_photos')
                if(imageUrl.error){
                    setLoading(false)
                    return Alert.alert('Erro', imageUrl.description)
                } 

                await setUser(String(user?.id), {photo: String(imageUrl.url)})
                    
                const response = await api.post('/profile-photo', {photo_url: imageUrl.url, user_id: user?.id})
                const res = response.data

                if(res.error){
                    setLoading(false)
                    Alert.alert('Erro', res.message)
                }
                Alert.alert('Sucesso', res.message)
                setLoading(false)
            }
        }
        catch(err){
            console.log('Erro ao abrir a galeria: ', err)
        }
    }

    if(loading){
        return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#000" />
            <Link href='/login/login'><Text>Carregando...</Text></Link>
        </View>
        );
    }    

    return(

        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={styles.container}>
                    
                    <View style={styles.photoBox}>
                        <Image source={user?.photo ? {uri: `${user?.photo}?${new Date().getTime()}`} : {}} style={styles.profilePhoto} cachePolicy='disk' />

                        <View style={styles.optionsBox}>
                        {!isEditing ? (
                            <>
                                <TouchableOpacity style={[styles.option, {width: '30%'}]} onPress={() => setIsEditing(true)}>
                                    <Text style={{ color: 'ghostwhite' }}>Editar perfil</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.option, {width: '30%'}]} onPress={() => {
                                    setTxtLoading(true)
                                    setTimeout(() => {
                                        pickImage()
                                    }, 1000)
                                }}>
                                    {txtLoading? (
                                        <ActivityIndicator color='white'/>
                                    ):(
                                        <Text style={{ color: 'ghostwhite' }}>Trocar foto</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Ionicons name='close' size={36} color={'red'} onPress={() => setIsEditing(false)}/>
                                <Ionicons name='checkmark-done-circle-outline' size={36} color={'green'} onPress={() => {
                                    Alert.alert('Selecione', 'Deseja salvar as alterações?', [
                                        {
                                            text: 'SIM',
                                            onPress: () => {
                                                setLoading(true);
                                                saveProfile()
                                            }
                                        },
                                        {
                                            text: 'NÃO'
                                        }
                                    ])
                                }}/>
                            </>
                        )}
                        </View>
                    </View>

                    <View style={styles.inputContainer}>

                        <View style={styles.inputBox}>
                            <Text style={styles.inputSpan}>Nome completo</Text>
                            <View style={styles.inputGroup}>
                                <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={user?.name || ''} editable={isEditing} onChangeText={(text) => setUser(String(user?.id), {name: text})}></TextInput>
                                <Ionicons name={isEditing ? 'create-outline' : 'lock-closed'} size={20} style={{right: '9%'}}/>
                            </View>
                        </View>

                        <View style={styles.inputBox}>
                            <Text style={styles.inputSpan}>Email</Text>
                            <View style={styles.inputGroup}>
                                <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={user?.mail || ''} editable={isEditing} onChangeText={(text) => setUser(String(user?.id), {mail: text})}></TextInput>
                                <Ionicons name={isEditing ? 'create-outline' : 'lock-closed'} size={20} style={{right: '9%'}}/>
                            </View>
                        </View>

                        <View style={styles.inputBox}>
                            <TouchableOpacity style={styles.option} onPress={() => {
                                setBtnLoading(true)
                                setTimeout(() => {
                                    setBtnLoading(false)
                                    setModal(true)
                                }, 1000)
                            }}>
                                {btnLoading ? (
                                    <ActivityIndicator color='white'/>
                                ) : (
                                    <Text style={{color: 'ghostwhite', textAlign: 'center'}}>Alterar a senha</Text>
                                )}
                            </TouchableOpacity>
                            <ResetPasswordModal visible={modal} onClose={() => setModal(false)} mail={user?.mail || ''}/>

                        </View>

                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        padding: 0,
        margin: 0,
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    photoBox:{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        width: '85%'
    },
    optionsBox:{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 20
    },
    option:{
        // padding: 10,
        height: 35,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        backgroundColor: process.env.EXPO_PUBLIC_MAIN_COLOR,
    },
    profilePhoto:{
        borderWidth: 1,
        borderColor: 'black',
        height: 200,
        width: 200,
        borderRadius: 60
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
    inputDisabled:{
        color: 'gray',
        borderRadius: 5,
        borderColor: '#00000021',
        borderWidth: 1,
        width: '100%',
        paddingLeft: 10,
        // color: '#000'
    },
    inputSpan:{
        fontWeight: 'bold',
        paddingLeft: 2
    }
})