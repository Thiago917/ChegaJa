import OrderCard from "@/components/orderCard";
import ToggleShopStatus from "@/components/toggleShopStatus";
import { useOrders } from "@/contexts/MyOrdersContext";
import { useShop } from "@/contexts/ShopContext";
import { useUser } from "@/contexts/UserContext";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR;

export default function Shopping() {
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  
  const {shop, setShop, loadShopData} = useShop()
  const {order} = useOrders()
  const {user} = useUser()

  const handleStatusChange = (status: boolean, id: string) => {
    if (status === shop?.status) return setModalVisible(false);

    if (status === false) {
      Alert.alert(
        'Quero mesmo fechar a loja?',
        'Você deixará de receber pedidos',
        [
          {
            text: 'NÃO',
            onPress: () => setModalVisible(false),
          },
          {
            text: 'SIM',
            onPress: async () => {
              try {
                await setShop(id, {status: status});
              } catch (err) {
                console.log(err);
              } finally {
                setModalVisible(false);
              }
            },
          },
        ]
      );
      return; 
    }

    setShop(id, {status: status});
    setModalVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true)
    try{
      await loadShopData()
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    catch(err){
      console.log(err)
    }
    finally{
      setRefreshing(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <Text style={styles.shopTitle}>{shop?.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: shop?.status ? '#E8F5E9' : '#FFEBEE' }]}>
          <TouchableOpacity style={[styles.statusBadge, { backgroundColor: shop?.status ? '#E8F5E9' : '#FFEBEE' }]} onPress={() => setModalVisible(true)}>
            <Text style={{ color: shop?.status ? '#2E7D32' : '#C62828', fontWeight: 'bold' }}>
                {shop?.status ? '● Aberto' : '● Fechado'} ▾
            </Text>
            </TouchableOpacity>
        </View>
          <ToggleShopStatus visible={modalVisible} onClose={() => setModalVisible(false)} onSelect={(status) => handleStatusChange(status, String(shop?.id))}/>
      </View>
      <Text style={{color: MAIN_COLOR, marginBottom: 20}}>● <Text style={{fontWeight: 'bold', color: MAIN_COLOR, textDecorationLine: 'underline'}} onPress={() => router.push('/shop/menu')}>Meu cardápio</Text></Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pedidos hoje</Text>
          <Text style={styles.statValue}>{shop?.orders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Faturamento</Text>
          <Text style={styles.statValue}>R$ {String(shop?.founding).replace('.',',')}</Text>
        </View>
      </View>

      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitle}>Pedidos de hoje</Text>

        <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[MAIN_COLOR || '#000000']}
            tintColor={MAIN_COLOR}          
         />}
        >
        {order?.map((item) => (
            <OrderCard key={item.id} id={item.id} cliente={user?.name || ''} itens={item.orderItems} horario={'09:59 AM'} total={item.total} status={item.status} pickupCode={item.pickupCode}/>
          ))}
        </ScrollView>
      </View>

    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', 
    paddingTop: 60,  
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  shopTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1, 
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MAIN_COLOR,
  },
  ordersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  placeholderCard: {
    height: 100,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  }
});