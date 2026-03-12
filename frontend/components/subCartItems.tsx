import { Text, View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { CartItems } from "./cartItems";
import { useCart } from "@/contexts/CartContext";

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c';

export default function SubCartItems({ cart, visible}: { cart: any[]; visible: boolean}) {
    
    const [cartVisible, setCartVisible] = useState<boolean>(false)
    const { updateQuantity } = useCart()
    const router = useRouter();

    if (!visible || cart.length === 0) return null;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.content} 
                activeOpacity={0.9}
                onPress={() => setCartVisible(true)} // Caminho para seu checkout
            >
                {/* Lado Esquerdo: Quantidade */}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                </View>

                {/* Centro: Texto de Ver Carrinho */}
                <View style={styles.infoContainer}>
                    <Text style={styles.viewCartText}>Ver carrinho</Text>
                    <Text style={styles.shopName}>ChegaJá Delivery</Text>
                </View>

                {/* Lado Direito: Preço Total */}
                <View style={styles.priceContainer}>
                    <Text style={styles.totalPrice}>
                        R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </Text>
                    <Ionicons name="cart-outline" size={20} color="#FFF" />
                </View>
            </TouchableOpacity>
            <CartItems cart={cart} updateQuantity={updateQuantity} visible={cartVisible} onClose={() => setCartVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20, // Distância do final da tela
        left: 16,
        right: 16,
        zIndex: 999, // Garante que fica em cima de tudo
    },
    content: {
        backgroundColor: MAIN_COLOR,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        elevation: 5, // Sombra no Android
        shadowColor: '#000', // Sombra no iOS
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    viewCartText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shopName: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    totalPrice: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});