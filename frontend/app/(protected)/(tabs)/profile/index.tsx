import { useUser } from "@/contexts/UserContext";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import ToggleSwitch from 'toggle-switch-react-native';

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR

export default function Profile(){

    const [loading, setLoading] = useState<boolean>(false)
    const [checked, setChecked] = useState<boolean>(false)
    const {user} = useUser();

    useEffect(() => {
        initBiometry();
    },[])

    const initBiometry = async () => {
        const value = await AsyncStorage.getItem('@biometry');
        if(value === 'true') setChecked(true);
    }

    const toggleBiometry = async (value: boolean) => {
        setChecked(value);
        await AsyncStorage.setItem('@biometry', value ? 'true' : 'false');
    }

    const logout = async () => {
        
        try{
            const token = await AsyncStorage.getItem('@refreshToken');
            if(!token) {
                Alert.alert('Não foi possível sair da sessão')
                setLoading(false)
                return;
            }

            setLoading(false)
            router.replace('/login/login')
        }
        catch(err){ 
            setLoading(false)
            console.log('Erro ao sair da sessão: ', err)
        }
        finally{
            setLoading(false)
        }
    }

    const dell_account = async () =>{
        
        try{
            const token = await AsyncStorage.getItem('@refreshToken');
            const response = await api.post('/deleteMe', {token})
            const res = response.data

            if(res.error){
                Alert.alert('Erro', res.message)
                setLoading(false)
                return;
            }
            await AsyncStorage.multiRemove(['@refreshToken', '@accessToken', '@enabledFingerPrint'])
            setLoading(false)
            router.replace('/login/login')
        }
        catch(err){
            console.log(err)
        }
        finally{
            setLoading(false)
        }
    }

    const sureLogout = () => {
        Alert.alert('Selecione', 'Deseja sair da conta?', [
            {
                text: 'SIM',
                onPress: () => logout()
            },
            {
                text: 'NÃO'
            }
        ])
    }

    const sureDell_account = () => {
        Alert.alert('Selecione', 'Deseja excluir sua conta?', [
            {
                text: 'SIM',
                onPress: () => dell_account()
            },
            {
                text: 'NÃO'
            }
        ])
    }

    if(loading){
        return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#000" />
            <Link href='/login/login'><Text>Carregando...</Text></Link>
        </View>
        );
    }

    return(
        <View style={styles.container}>
            <View style={styles.prof_box}>
                <View style={styles.photoContainer}>
                    <Image 
                        style={styles.photoBox} 
                        source={user?.photo ? {uri: user.photo} : {uri: 'https://via.placeholder.com/150'}} 
                        resizeMode="cover"
                    />
                    {/* Um pequeno botão de 'editar' sobre a foto dá um ar profissional */}
                    <View style={styles.editBadge}>
                        <Ionicons name="camera" size={12} color={'#fff'} />
                    </View>
                </View>
                
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
                    <Text style={styles.userSubtitle} onPress={() => router.push('/profile/edit-profile')}>Ver meu perfil</Text>
                </View>
                <Ionicons name='swap-horizontal-sharp' size={18} color={MAIN_COLOR} style={{ marginTop: 4 }} />
            </View>

            <View>
    
                <Text style={styles.sectionHeader}>Minha Conta</Text>
                <View style={styles.sectionGroup}>
                    <TouchableOpacity style={styles.options} onPress={() => router.push('/profile/edit-profile')}>
                        <View style={styles.itemLeftSide}>
                            <Ionicons name='pencil-sharp' size={22} color={'#303030d3'}/>
                            <Text style={styles.option}>Editar perfil</Text>
                        </View>
                        <Ionicons name='chevron-forward' size={18} color={'#c7c7c7'}/>
                    </TouchableOpacity>
                    
                </View>

                <Text style={styles.sectionHeader}>Segurança</Text>
                <View style={styles.sectionGroup}>
                    <View style={styles.options}>
                        <View style={styles.itemLeftSide}>
                            <Ionicons name='finger-print' size={22} color={'#303030d3'}/>
                            <Text style={styles.option}>Entrar com digital</Text>
                        </View>
                        <Switch value={checked} trackColor={{ false: "#767577", true: MAIN_COLOR + '80' }} thumbColor={true ? MAIN_COLOR : "#f4f3f4"} onValueChange={toggleBiometry}/>
                    </View>
                </View>

                <View style={[styles.sectionGroup, { marginTop: 30, borderTopWidth: 0 }]}>
                    <TouchableOpacity style={styles.options} onPress={sureLogout}>
                        <View style={styles.itemLeftSide}>
                            <Ionicons name='log-out' size={22} color={'#303030d3'}/>
                            <Text style={styles.option}>Sair</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.options, { borderBottomWidth: 0 }]} onPress={sureDell_account}>
                        <View style={styles.itemLeftSide}>
                            <Ionicons name='trash-bin-outline' size={22} color={'#de0404'}/>
                            <Text style={[styles.option, {color: '#de0404'}]}>Excluir minha conta</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    )
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    prof_box: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: '#FFF',
        marginTop: 50, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    photoContainer: {
        position: 'relative',
    },
    photoBox: {
        width: 70, 
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#f0f0f0', 
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: process.env.EXPO_PUBLIC_MAIN_COLOR, 
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userInfo: {
        marginLeft: 15,
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    userSubtitle: {
        fontSize: 13,
        color: '#888', 
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#888',
        textTransform: 'uppercase',
        marginLeft: 20,
        marginTop: 25,
        marginBottom: 8,
    },
    sectionGroup: {
        backgroundColor: '#FFF',
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: '#EEE',
    },
    options: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomColor: '#F0F0F0',
        borderBottomWidth: 1,
    },
    itemLeftSide: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    option: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
});
