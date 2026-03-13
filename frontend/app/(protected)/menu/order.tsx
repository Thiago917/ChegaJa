import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AddressLocation from "@/components/addressLocation";
import { useCart } from "@/contexts/CartContext";
import { useUser } from '@/contexts/UserContext'
import { AddressType, useAddress } from "@/contexts/AddressContext";
import Checkbox from "expo-checkbox";


const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c';

export default function Order(){

    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix' | null>(null);
    const [visible, setVisible] = useState<boolean>(false);
    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [addressData, setAddressData] = useState<AddressType | null>(null);
    const [loadingId, setLoadingId] = useState<number | null>(null)

    const { user } = useUser();
    const { address, setAddress } = useAddress();
    const { cart, getCartSubtotal, getCartTotal } = useCart();

    const subtotal = getCartSubtotal();
    const deliveryFee = 8.99;
    const total = getCartTotal();

    const toggleDefaultAddress = async (id: number) => {
        setLoadingId(id)
        try{    
            await setAddress(id, {isDefault: true})
        }
        catch(err){
            console.log('Deu ruim | ', err)
        }
        finally{
            setLoadingId(null)
        }
    }

    return(
        <View style={styles.container}>
            <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
                
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Resumo do Pedido</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {step === 1 ? ( // Detalhes do Pedido
                        <>
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
                                                <Text style={styles.itemQuantity}>Quantidade: {item.quantity}</Text>
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

                            {/* Seção de Observações */} 
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="document-text" size={20} color={MAIN_COLOR} />
                                    <Text style={styles.sectionTitle}>Observações</Text>
                                </View>
                                <View style={styles.notesBox}>
                                    <TextInput style={styles.notesPlaceholder} placeholder="Adicionar observações sobre o pedido..." placeholderTextColor={'gray'} numberOfLines={4}/>
                                </View>
                            </View>
                        </>
                    ) : step === 2 ? ( // Endereço de Entrega
                        <View style={styles.section}>
                            <View style={[styles.sectionHeader, { justifyContent: 'space-between', marginBottom: 16 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="location" size={20} color={MAIN_COLOR} />
                                    <Text style={styles.sectionTitle}>Selecione o endereço</Text>
                                </View>
                                <TouchableOpacity onPress={() => { setAddressData(null); setVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Novo</Text>
                                    <Ionicons name="add-circle" size={20} color={MAIN_COLOR} />
                                </TouchableOpacity>
                            </View>

                            {address?.map((item) => {

                                return (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        activeOpacity={0.8}
                                        onPress={() => {toggleDefaultAddress(item.id)}}
                                        style={[
                                            styles.deliveryBox, 
                                            { 
                                                marginBottom: 12,
                                                borderLeftWidth: item.isDefault ? 6 : 4,
                                                borderColor: item.isDefault ? MAIN_COLOR : '#DDD',
                                                backgroundColor: item.isDefault ? '#fffafa' : '#F9F9F9',
                                                elevation: item.isDefault ? 3 : 0,
                                                shadowColor: MAIN_COLOR,
                                                shadowOpacity: item.isDefault ? 0.1 : 0,
                                                shadowRadius: 4,
                                            }
                                        ]}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.deliveryAddress, { color: item.isDefault ? MAIN_COLOR : '#333' }]}>
                                                    {item.logradouro}, {item.numero}, {item.complemento}
                                                </Text>
                                                <Text style={styles.deliveryDetails}>
                                                    {item.bairro} | {item.cidade} - {item.estado}
                                                </Text>
                                            </View>
                                            
                                        <View style={{ width: 30, alignItems: 'center' }}>
                                            {loadingId === item.id ? (
                                                <ActivityIndicator size="small" color={MAIN_COLOR} />
                                            ) : (
                                                <View style={[
                                                    styles.checkbox, 
                                                    { backgroundColor: item.isDefault ? MAIN_COLOR : 'transparent', borderColor: item.isDefault ? MAIN_COLOR : 'black'}
                                                ]}>
                                                    {item.isDefault && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                                </View>
                                            )}
                                        </View>

                                            <View style={{ 

                                            }}>
                                                {item.isDefault && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                            </View>
                                        </View>

                                        <TouchableOpacity 
                                            style={[styles.editButton, { marginTop: 8, alignSelf: 'flex-start' }]} 
                                            onPress={() => {
                                                setAddressData(item); 
                                                setVisible(true);
                                            }}
                                        >
                                            <Text style={[styles.editButtonText, { color: item.isDefault ? MAIN_COLOR : '#888' }]}>
                                                Editar informações
                                            </Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : ( // Método de Pagamento
                        <>
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
                        </>

                    )}

                </ScrollView>
                <AddressLocation visible={visible} onClose={() => {setVisible(false); setAddressData(null);}}  address={addressData} userId={Number(user?.id)}/>

                <View style={[styles.footer, { backgroundColor: '#FAFAFA' }]}>
                    <View style={styles.buttonContainer}>
                        {/* Botão Voltar */}
                        {step > 1 && (
                            <TouchableOpacity 
                                style={[styles.backButtonAction, { borderColor: MAIN_COLOR }]} 
                                onPress={() => setStep(prev => prev - 1)}
                                disabled={loading}
                            >
                                <Ionicons name="chevron-back" size={20} color={MAIN_COLOR} />
                                <Text style={[styles.backButtonText, { color: MAIN_COLOR }]}>Voltar</Text>
                            </TouchableOpacity>
                        )}

                        {/* Botão Continuar/Confirmar */}
                        <TouchableOpacity 
                            style={[
                                styles.confirmButtonAction, 
                                { backgroundColor: MAIN_COLOR, flex: 1, opacity: (step === 3 && !paymentMethod) || loading ? 0.7 : 1 }
                            ]} 
                            activeOpacity={0.8} 
                            disabled={loading || (step === 3 && !paymentMethod)}
                            onPress={() => {
                                if (step < 3) {
                                    setLoading(true);
                                    setTimeout(() => {
                                        setLoading(false);
                                        setStep(prev => prev + 1);
                                    }, 400);
                                }
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.confirmButtonText}>
                                        {step < 3 ? 'Continuar' : 'Confirmar Pedido'}
                                    </Text>
                                    <Ionicons 
                                        name={step < 3 ? "chevron-forward" : "checkmark-circle"} 
                                        size={20} 
                                        color="#FFF" 
                                        style={{ marginLeft: 8 }} 
                                    />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        borderLeftColor: MAIN_COLOR,
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
        color: MAIN_COLOR,
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
        borderColor: MAIN_COLOR,
        backgroundColor: MAIN_COLOR,
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
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingBottom: 30,
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButtonAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    confirmButtonAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    checkbox:{
        width: 22, 
        height: 22, 
        borderRadius: 11, 
        borderWidth: 1.5, 
        alignItems: 'center',
        justifyContent: 'center',
    }
});
