import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function CartItems({ cart, updateQuantity, clearItemCart, visible, onClose }: { cart: { id: string; item: any; quantity: number }[]; updateQuantity: (item: any, delta: number) => void; clearItemCart: (item: any) => void; visible: boolean; onClose: () => void }) {

    const MAIN_COLOR  = process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c';
    const [loading, setLoading] = useState<boolean>(false);

    return(
        <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => onClose()}
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Carrinho</Text>
                <TouchableOpacity onPress={() => onClose()}>
                <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
                {cart.length > 0 ? (
                <>
                    {cart.map((cartItem) => (
                    <View key={cartItem.id} style={styles.modalCartItem}>
                        <Image source={{ uri: cartItem.item.photo }} style={styles.modalCartItemImage}/>
                        <View style={styles.modalCartItemInfo}>
                          <Text style={styles.modalCartItemName}>{cartItem.item.name}</Text>
                          <Text style={styles.modalCartItemPrice}>R$ {String(cartItem.item.price.toFixed(2)).replace('.', ',')}</Text>
                          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '120%'}}>
                            <View style={styles.modalQuantityControl}>
                              <TouchableOpacity style={styles.modalQtyBtn} onPress={() => updateQuantity(cartItem.item, -1)}>
                              <Ionicons name="remove" size={18} color="#FFF" />
                              </TouchableOpacity>
                              <Text style={styles.modalQtyText}>{cartItem.quantity}</Text>
                              <TouchableOpacity style={styles.modalQtyBtn} onPress={() => updateQuantity(cartItem.item, 1)}>
                              <Ionicons name="add" size={18} color="#FFF" />
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() =>clearItemCart(cartItem.item)} disabled={cartItem.quantity > 1 ? true : false}>
                              <Ionicons name='trash-bin' color={cartItem.quantity === 1 ? '#e74c3c' : '#e27a6e' } size={20} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={styles.modalCartItemTotal}>R$ {String((cartItem.item.price * cartItem.quantity).toFixed(2)).replace('.', ',')}</Text>
                    </View>
                    ))}
                    <View style={styles.modalDivider} />

                    <View style={styles.modalSummary}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal:</Text>
                        <Text style={styles.summaryValue}>
                          R$ {String(cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0).toFixed(2)).replace('.', ',')}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Entrega:</Text>
                        <Text style={styles.summaryValue}>R$ 8,99</Text>
                    </View>
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 12, marginTop: 12 }]}>
                        <Text style={styles.summaryLabelTotal}>Total:</Text>
                        <Text style={styles.summaryValueTotal}>
                        R$ {String((cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0) + 8.99).toFixed(2)).replace('.', ',')}
                        </Text>
                    </View>
                    </View>

                    <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: MAIN_COLOR }]} disabled={loading} onPress={() => {
                        setLoading(true);
                        setTimeout(() => {
                            setLoading(false);
                            onClose();  
                            router.push('/menu/order');
                        }, 700);
                    }}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.checkoutBtnText}>Fazer Pedido</Text>
                        ) }
                    </TouchableOpacity>
                </>
                ) : (
                <View style={styles.emptyCart}>
                    <Ionicons name="cart-outline" size={60} color="#DDD" />
                    <Text style={styles.emptyCartText}>Seu carrinho está vazio</Text>
                </View>
                )}
            </ScrollView>
            </View>
        </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalCartItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  modalCartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  modalCartItemInfo: {
    flex: 1,
  },
  modalCartItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalCartItemPrice: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  modalQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  modalQtyBtn: {
    backgroundColor: '#e74c3c',
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalQtyText: {
    marginHorizontal: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCartItemTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 16,
  },
  modalSummary: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  summaryLabelTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  checkoutBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCart: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
})