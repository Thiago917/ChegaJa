import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNears } from "@/contexts/nearShopsContext";
import { useCart } from "@/contexts/CartContext";
import { CartItems } from "@/components/cartItems";
import AddressLocation from "@/components/addressLocation";
import { useUser } from "@/contexts/UserContext";
import SubCartItems from "@/components/subCartItems";
import { useAddress } from "@/contexts/AddressContext";

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR;

export default function Home() {

    const router = useRouter();

    const [search, setSearch] = useState<string>('');
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [visible, setVisible] = useState<boolean>(false)
    const [addressModal, setAddressModal] = useState<boolean>(false)
    const [subCartItemsVisible, setSubCartItemsVisible] = useState<boolean>(false)
    
    const { user } = useUser();
    const { stores, loadNearShop} = useNears()
    const { cart, getCartItemsCount, updateQuantity } = useCart();
    const { address } = useAddress()

    const currentAddress = address?.find((item) => item.isDefault === true ) || null

    useFocusEffect(
        useCallback(() => {
            loadNearShop()
            checkBiometry();
            checkCartItems();
        }, [cart])
    )

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await loadNearShop()
        setRefreshing(false)
    }, [])
    
    const checkBiometry = async () => {
        try {
            const biometry = await AsyncStorage.getItem('@enabledFingerPrint');
            if (!biometry) {
                Alert.alert('Segurança', 'Deseja entrar na próxima vez com a biometria?', [
                    { text: 'SIM', onPress: async () => await AsyncStorage.setItem('@enabledFingerPrint', 'true') },
                    { text: 'NÃO' }
                ]);
            }
        } catch (err) {
            console.log('Erro ao ativar biometria');
        }
    };

    const checkCartItems = async () => {
        cart.length > 0 ? setSubCartItemsVisible(true) : setSubCartItemsVisible(false);
    }

    return (
        <View style={styles.container}>
            {/* 1. Header com Localização */}
            <View style={styles.header}>
                <View>
                    <TouchableOpacity onPress={() => setAddressModal(true)}>
                        <Text style={styles.locationLabel}>Entregar em</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={16} color={MAIN_COLOR} />
                            <Text style={styles.locationText} numberOfLines={1}>{currentAddress?.logradouro} - {currentAddress?.numero}</Text>
                            <Ionicons name="chevron-down" size={14} color={MAIN_COLOR} style={{ marginLeft: 4 }} />
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.cartIconContainer} onPress={() => setVisible(true)}>
                        <Ionicons name="cart" size={24} color={MAIN_COLOR} />
                        {getCartItemsCount() > 0 && (
                            <View style={[styles.badge, { backgroundColor: MAIN_COLOR }]}>
                                <Text style={styles.badgeText}>{getCartItemsCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Image 
                            style={styles.userAvatar} 
                            source={user?.photo ? { uri: user?.photo } : { uri: 'https://via.placeholder.com/150' }} 
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 2. Barra de Busca */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#888" />
                <TextInput 
                    placeholder="Qual loja você procura?"
                    placeholderTextColor={'gray'} 
                    style={styles.searchInput} 
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
        
            {/* 3. Lista de Lojas */}
            <FlatList
                data={Array.isArray(stores) ? stores : []}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<Text style={styles.sectionTitle}>Lojas Disponíveis</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.shopCard} activeOpacity={0.7} 
                        onPress={() =>{
                            if(item.status === true) return router.push({
                                pathname: `../menu/${item.id}`,
                                params: { distance: String(item.distance) }
                            })
                        }}  
                    >
                        
                        <Image source={ item.photo ? { uri: item.photo } : {}} style={styles.shopLogo} contentFit="cover" />
                        
                        <View style={styles.shopInfo}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                                <Text style={{color: item.status ? '#2E7D32' : '#C62828', fontWeight: 'bold', marginRight: 20}}> {item.status ? 'Aberto' : 'Fechado'}</Text>
                            </View>
                            
                            <View style={styles.shopDetails}>
                                <Ionicons name="star" size={14} color="#C6A400" />
                                <Text style={styles.ratingText}>4.8</Text>
                                <Text style={styles.dot}>•</Text>
                                <Text style={styles.categoryText}>{item.branch || ''}</Text>
                                <Text style={styles.dot}>•</Text>
                                <Text style={styles.distanceText}>{item.distance ? `${item.distance.toFixed(1)} km` : '-- km'}</Text>
                            </View>

                            <View style={styles.deliveryRow}>
                                <Text style={styles.deliveryTime}>25-35 min</Text>
                                <Text style={styles.dot}>•</Text>
                                <Text style={styles.deliveryPrice}>Frete R$ 5,00</Text>
                            </View>
                        </View>
                        
                        <Ionicons name="chevron-forward" size={18} color="#EEE" />
                    </TouchableOpacity>
                )}
            />
            <CartItems cart={cart} updateQuantity={updateQuantity} visible={visible} onClose={() => setVisible(false)} />
            <SubCartItems cart={cart} visible={subCartItemsVisible}/>
                
            <AddressLocation visible={addressModal} onClose={() => setAddressModal(false)} address={currentAddress} userId={Number(user?.id)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    locationLabel: {
        fontSize: 10,
        color: '#999',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginLeft: 4,
        maxWidth: 200,
    },
    userAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 2,
        borderColor: '#ff8c0087',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        marginTop: 4,
    },
    shopCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0', // Estilo iFood: linha em vez de card flutuante pesado
    },
    shopLogo: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#F9F9F9',
    },
    shopInfo: {
        flex: 1,
        marginLeft: 14,
    },
    shopName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    shopDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingText: {
        color: '#C6A400',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 13,
    },
    categoryText: {
        fontSize: 13,
        color: '#666',
    },
    distanceText: {
        fontSize: 13,
        color: '#666',
    },
    dot: {
        marginHorizontal: 6,
        color: '#CCC',
        fontSize: 10,
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deliveryTime: {
        fontSize: 13,
        color: '#444',
    },
    deliveryPrice: {
        fontSize: 13,
        color: '#444',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cartIconContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    }
});