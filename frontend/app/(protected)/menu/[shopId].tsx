import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Products } from '@/contexts/MenuContext';
import { CartItems } from '@/components/cartItems';
import { useCart } from '@/contexts/CartContext';

export default function MenuScreen() {
  const { shopId, distance } = useLocalSearchParams();
  const [menu, setMenu] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const { cart, updateQuantity, getCartItemsCount } = useCart();
  const distanceFormatted = distance ? `${parseFloat(distance as string).toFixed(1)} km` : '-- km';
  
  const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c';

  useEffect(() => {
    if (shopId) loadMenu();
  }, [shopId]);

  const loadMenu = async () => {
    try {
      const response = await api.get(`/shop-products/${shopId}`);
      if (response.data.response){
          setMenu(response.data.response);
          setShop(response.data.shop);
      } 
    } catch (error) {
      console.log('Erro:', error);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 500)
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={MAIN_COLOR} />;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.coverContainer}>
          <Image 
            source={{ uri: 'https://media.istockphoto.com/id/1300665551/pt/foto/feijoada-brazilian-traditional-dish.webp?s=2048x2048&w=is&k=20&c=AELQs4EnpsAS_ulSkqWhfbml9nMZ4b8STA8O1pLmtzM=' }} 
            style={styles.coverImage} 
          />
          <View style={styles.topButtons}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('../home')}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.iconCircle}><Ionicons name="heart-outline" size={22} color="#FFF" /></TouchableOpacity>
              <TouchableOpacity style={[styles.iconCircle, { marginLeft: 10 }]}><Ionicons name="search" size={22} color="#FFF" /></TouchableOpacity>
              <TouchableOpacity style={[styles.iconCircle, { marginLeft: 10, position: 'relative' }]} onPress={() => setCartModalVisible(true)}>
                <Ionicons name="cart" size={22} color="#FFF" />
                {cart.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.shopCard}>
          <View style={styles.logoContainer}>
            <Image source={{ uri: shop?.photo || 'https://via.placeholder.com/60' }} style={styles.shopLogo} />
          </View>
          
          <View style={styles.shopHeaderRow}>
             <TouchableOpacity onPress={() => router.push('../shop/')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.shopName}>{shop?.name || ''}</Text>
                <Ionicons name="chevron-forward" size={18} color="#666" />
             </TouchableOpacity>
          </View>

          <Text style={styles.shopSub}>Entrega rastreável • {distanceFormatted} • Min R$ 20,00</Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#C6A400" />
            <Text style={styles.ratingText}>4,9 (1 mil avaliações)</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="shield-checkmark" size={14} color={MAIN_COLOR} />
            <Text style={[styles.superText, { color: MAIN_COLOR }]}>Super</Text>
          </View>

          <View style={styles.deliveryInfoRow}>
            <Text style={styles.deliveryMain}>Padrão • 45-60 min • R$ 8,99</Text>
          </View>
        </View>

        {menu.map((category) => (
          <View key={category.category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category.category}</Text>
            
            <View style={styles.grid}>
              {category.products.map((product: any) => {
                const cartItem = cart.find(item => item.item.id === product.id);
                return (
                <View key={product.id} style={[styles.productItem, !product.status && styles.disabledProduct]}>
                    <Image source={{ uri: product.photo }} style={[styles.productImage, !product.status && styles.disabledImage]} />
                    {cartItem && cartItem.quantity > 0 && (
                      <View style={[styles.badge, { backgroundColor: MAIN_COLOR }]}>
                        <Text style={styles.badgeText}>{cartItem.quantity}</Text>
                      </View>
                    )}
                  <View style={{ justifyContent: 'center', marginTop: 8, height: 50 }}>
                    <Text style={[styles.productName, !product.status && styles.disabledText]} numberOfLines={2}>{product.name}</Text>
                    <Text style={[styles.productPrice, !product.status && styles.disabledText]}>R$ {String(product.price.toFixed(2)).replace('.',',')}</Text>
                  </View>
                  
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity disabled={!product.status} style={[styles.quantityButton, !product.status && styles.disabledButton]} activeOpacity={0.8} onPress={() => updateQuantity(product, -1)}>
                      <Ionicons name="remove" size={20} color={!product.status ? '#CCC' : MAIN_COLOR} />
                    </TouchableOpacity>
                    <TouchableOpacity disabled={!product.status} style={[styles.quantityButton, !product.status && styles.disabledButton]} activeOpacity={0.8} onPress={() => updateQuantity(product, 1)}>
                      <Ionicons name="add" size={20} color={!product.status ? '#CCC' : MAIN_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
                );
              })}
            </View>
          </View>
        ))}

        <CartItems cart={cart} updateQuantity={updateQuantity} visible={cartModalVisible} onClose={() => setCartModalVisible(false)} />
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  coverContainer: { 
    height: 200, 
    width: '100%'
  },
  coverImage: { 
    width: '100%', 
    height: '100%' 
  },
  topButtons: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Shop Card
  shopCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 15,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoContainer: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    padding: 4,
    backgroundColor: '#FFF',
    borderRadius: 40,
  },
  shopLogo: { width: 60, height: 60, borderRadius: 30 },
  shopHeaderRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  shopName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginRight: 5 },
  shopSub: { textAlign: 'center', color: '#888', fontSize: 12, marginVertical: 8 },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#333', marginLeft: 4, fontWeight: '500' },
  dot: { marginHorizontal: 8, color: '#CCC' },
  superText: { fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  deliveryInfoRow: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 15, paddingTop: 10 },
  deliveryMain: { textAlign: 'center', fontSize: 13, color: '#333' },
  // Grid Products
  section: { marginTop: 25, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productItem: { width: '31%', marginBottom: 20 }, // 3 colunas
  productImage: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F5F5F5' },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#111', marginTop: 8, textAlign: 'center' },
  productName: { fontSize: 13, color: '#555', marginTop: 2, height: 30},
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  disabledProduct: {
    opacity: 0.5,
  },
  disabledImage: {
    opacity: 0.7,
  },
  disabledText: {
    color: '#999',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  quantityContainer:{
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 6
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Cart Badge
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  }
});