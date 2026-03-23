import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { useOrders } from '@/contexts/MyOrdersContext';
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, useCallback } from "react";
import { Image } from "expo-image";
import api from "@/services/api";

export default function Orders() {
    const { order, loadOrders } = useOrders();
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadingId, setLoadingId] = useState<number | null>(null)

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    }, [loadOrders]);

    const activeOrders = useMemo(() => 
        order?.filter(o => ['paid', 'preparing', 'shipped'].includes(o.status)) || [], 
    [order]);

    const pastOrders = useMemo(() => 
        order?.filter(o => ['delivered', 'cancelled', 'completed'].includes(o.status)) || [], 
    [order]);

    const getStatusDetails = (status: string) => {
        switch (status) {
            case 'paid': return { label: 'Aguardando', color: '#f39c12', icon: 'time-outline' };
            case 'preparing': return { label: 'Preparando', color: '#3498db', icon: 'restaurant-outline' };
            case 'shipped': return { label: 'Em rota', color: '#9b59b6', icon: 'bicycle-outline' };
            case 'delivered': return { label: 'Entregue', color: '#2ecc71', icon: 'checkmark-circle-outline' };
            default: return { label: 'Cancelado', color: '#e74c3c', icon: 'close-circle-outline' };
        }
    };

    const cancelOrder = async (id: number) => {
        setLoadingId(id)
        try{
            const response = await api.patch(`/cancel-order/${id}`)
            const res = response.data

            if(res.error){
                setLoadingId(null)
                Alert.alert('Erro', `${res.message}`)
                return;
            }
            
            setLoadingId(null)
            Alert.alert('Sucesso', `${res.message}`)
            return;
        }   
        catch(err){
            setLoadingId(null)
            console.log('Erro ao cancelar pedido: ',err)
        }
    }
    
    const OrderCard = ({ item }: { item: any }) => {
        const status = getStatusDetails(item.status);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.shopInfo}>
                        <Image 
                            source={{ uri: item.shop?.photo || 'https://via.placeholder.com/45' }} 
                            style={styles.shopLogo} 
                        />
                        <View style={styles.shopTextContainer}>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '90%'}}>
                                <Text style={styles.shopName}>{item.shop?.name}</Text>
                                <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                    <Text style={{color: 'gray', fontSize: 12}}>#{item.id}</Text>
                                    <Ionicons name='chevron-forward' size={12} color={'gray'} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.statusRow}>
                                <Text style={styles.statusText}>{status.label}</Text>
                                <Ionicons name={status.icon as any} size={14} color="#2ecc71" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Conteúdo Central (Itens e Foto) */}
                <View style={styles.contentRow}>
                    <View style={styles.itemsList}>
                        {item.orderItems?.map((prod: any, idx: number) => (
                            <View key={idx} style={styles.itemLine}>
                                <View style={{flexDirection: 'row'}}>
                                    <Text style={styles.qtyBox}>{prod.quantity}</Text>
                                    <Text style={styles.productName} numberOfLines={1}>{prod.product?.name}</Text>
                                </View>

                                <Text style={styles.productName} numberOfLines={1}>R$ {String(prod.price.toFixed(2)).replace('.',',')}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Botões de Ação Inferiores */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.btnAction} onPress={() => cancelOrder(item.id)}>
                        
                        {loadingId === item.id ? (
                            <ActivityIndicator color={'#ea1d2c'}/>
                        ) : (
                            <Text style={styles.btnTextRed}>Cancelar</Text>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.btnAction}>
                        <Text style={styles.btnTextRed}>Adicionar à sacola</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScrollView 
            style={styles.mainContainer} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea1d2c" />
            }>
            <Text style={styles.pageTitle}>Histórico</Text>

            {activeOrders.length > 0 && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>Em andamento</Text>
                    {activeOrders.map(item => <OrderCard key={item.id} item={item} />)}
                </View>
            )}

            <View style={styles.sectionContainer}>
                {pastOrders.length > 0 ? (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>Finalizados</Text>
                        {pastOrders.map(item => <OrderCard key={item.id} item={item} />)}
                    </View>
                ) : (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>Nenhum pedido recente.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 40,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3e3e3e',
        marginBottom: 20,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#717171',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f2f2f2',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    shopInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shopLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#f5f5f5',
    },
    shopTextContainer: {
        justifyContent: 'center',
    },
    shopName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3e3e3e',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusText: {
        fontSize: 13,
        color: '#717171',
        marginRight: 4,
    },
    contentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    itemsList: {
        flex: 1,
        paddingRight: 10,
    },
    itemLine: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    qtyBox: {
        backgroundColor: '#f2f2f2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    qtyText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3e3e3e',
    },
    productName: {
        fontSize: 14,
        color: '#717171',
    },
    productImage: {
        width: 55,
        height: 55,
        borderRadius: 6,
        backgroundColor: '#f5f5f5',
    },
    divider: {
        height: 1,
        backgroundColor: '#f8f8f8',
        marginVertical: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    btnAction: {
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    btnTextRed: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ea1d2c',
    },
    emptyBox: {
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#999',
    },
});