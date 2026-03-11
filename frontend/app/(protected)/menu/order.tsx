import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/contexts/CartContext";
import { useUser } from '@/contexts/UserContext'
import AddressLocation from "@/components/addressLocation";

export default function Order(){

    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix' | null>(null);
    const [visible, setVisible] = useState<boolean>(false);
    const [deliveryAddress, setDeliveryAddress] = useState({
        street: 'Rua das Marmitas',
        number: '123',
        complement: 'Apartamento 42',
        neighborhood: 'Bairro Central',
        city: 'São Paulo',
        cep: '01234-567',
        label: 'Residência'
    });
    const { user } = useUser();
    const { cart, getCartSubtotal, getCartTotal } = useCart();
    
    // const handleAddressSave = (newAddress: any) => {
        //     setDeliveryAddress(newAddress);
        // };
        
        // Dados do carrinho via Context
    const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c';
    const address = user?.address || {street: 'Rua das Marmitas',number: '123', complement: 'Na encruzilhada', neighborhood: 'Bairro Central'}
    const subtotal = getCartSubtotal();
    const deliveryFee = 8.99;
    const total = getCartTotal();

    return(
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Resumo do Pedido</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Seção de Entrega */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location" size={20} color={MAIN_COLOR} />
                        <Text style={styles.sectionTitle}>Entrega em</Text>
                    </View>
                    <View style={styles.deliveryBox}>
                        <Text style={styles.deliveryAddress}>{address.street}, {address.number}</Text>
                        <Text style={styles.deliveryDetails}>{address.complement} - {address.neighborhood}</Text>
                        <TouchableOpacity style={styles.editButton} onPress={() => {setVisible(true)}}>
                            <Text style={[styles.editButtonText, { color: MAIN_COLOR }]}>Alterar endereço</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <AddressLocation visible={visible} onClose={() => setVisible(false)}/>

                {/* Seção de Itens */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cart" size={20} color={MAIN_COLOR} />
                        <Text style={styles.sectionTitle}>Itens do Pedido</Text>
                    </View>
                    <FlatList
                        data={cart}
                        scrollEnabled={false}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => (
                            <View style={styles.orderItem}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.item.name}</Text>
                                    <Text style={styles.itemQuantity}>Qtd: {item.quantity}</Text>
                                </View>
                                <Text style={styles.itemPrice}>R$ {(item.item.price * item.quantity).toFixed(2).replace('.', ',')}</Text>
                            </View>
                        )}
                    />
                </View>

                {/* Seção de Resumo */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calculator" size={20} color={MAIN_COLOR} />
                        <Text style={styles.sectionTitle}>Resumo</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>R$ {subtotal.toFixed(2).replace('.', ',')}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Taxa de entrega</Text>
                            <Text style={styles.summaryValue}>R$ {deliveryFee.toFixed(2).replace('.', ',')}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
                        </View>
                    </View>
                </View>

                {/* Seção de Pagamento */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="card" size={20} color={MAIN_COLOR} />
                        <Text style={styles.sectionTitle}>Método de Pagamento</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.paymentOption, paymentMethod === 'credit' && styles.paymentSelected]}
                        onPress={() => setPaymentMethod('credit')}
                    >
                        <View style={styles.paymentRadio}>
                            {paymentMethod === 'credit' && <View style={[styles.radioFill, { backgroundColor: MAIN_COLOR }]} />}
                        </View>
                        <Text style={styles.paymentText}>Cartão de Crédito</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.paymentOption, paymentMethod === 'debit' && styles.paymentSelected]}
                        onPress={() => setPaymentMethod('debit')}
                    >
                        <View style={styles.paymentRadio}>
                            {paymentMethod === 'debit' && <View style={[styles.radioFill, { backgroundColor: MAIN_COLOR }]} />}
                        </View>
                        <Text style={styles.paymentText}>Cartão de Débito</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.paymentOption, paymentMethod === 'pix' && styles.paymentSelected]}
                        onPress={() => setPaymentMethod('pix')}
                    >
                        <View style={styles.paymentRadio}>
                            {paymentMethod === 'pix' && <View style={[styles.radioFill, { backgroundColor: MAIN_COLOR }]} />}
                        </View>
                        <Text style={styles.paymentText}>PIX</Text>
                    </TouchableOpacity>
                </View>

                {/* Observações */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text" size={20} color={MAIN_COLOR} />
                        <Text style={styles.sectionTitle}>Observações</Text>
                    </View>
                    <View style={styles.notesBox}>
                        <Text style={styles.notesPlaceholder}>Adicionar observações sobre o pedido...</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Botão Flutuante de Confirmação */}
            <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: MAIN_COLOR }]}
                activeOpacity={0.8}
            >
                <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
                <Ionicons name="checkmark" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        marginTop: 50,
        marginBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    deliveryBox: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c',
    },
    deliveryAddress: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    deliveryDetails: {
        fontSize: 12,
        color: '#888',
        marginBottom: 12,
    },
    editButton: {
        paddingVertical: 6,
    },
    editButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    itemQuantity: {
        fontSize: 12,
        color: '#888',
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12,
    },
    summaryBox: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#666',
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#DDD',
        paddingTop: 12,
        marginTop: 12,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
    },
    paymentSelected: {
        borderColor: process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c',
        backgroundColor: `${process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c'}10`,
    },
    paymentRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioFill: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    paymentText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    notesBox: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        minHeight: 80,
        justifyContent: 'flex-start',
    },
    notesPlaceholder: {
        fontSize: 13,
        color: '#AAA',
    },
    confirmButton: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
