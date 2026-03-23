import { OrderItemsType, useOrders } from '@/contexts/MyOrdersContext';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useState } from 'react';

type OrderProps = {
  id: number;
  cliente: string;
  itens: any[]; // Ajuste conforme seu tipo
  horario: string;
  total: number;
  status: string; // Adicionado status atual
};

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR

export default function OrderCard({ id, cliente, itens, horario, total, status }: OrderProps) {
  
  const [loading, setLoading] = useState<boolean>(false)
  const { setOrders } = useOrders();

  const handleUpdateStatus = async () => {
    let nextStatus = '';
    let label = '';
    setLoading(true)

    if (status === 'paid') { nextStatus = 'preparing'; label = 'Preparar'; }
    else if (status === 'preparing') { nextStatus = 'shipped'; label = 'Enviar para Entrega'; }
    else if (status === 'shipped') { nextStatus = 'delivered'; label = 'Finalizar'; }

    if (!nextStatus) return setLoading(false);

    try {
      await setOrders(id, { status: nextStatus });
      setLoading(false)
    } catch (error) {
      setLoading(false)
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid': return { label: 'Pendente', color: '#f39c12', next: 'Preparar' };
      case 'preparing': return { label: 'Em preparo', color: '#3498db', next: 'Despachar' };
      case 'shipped': return { label: 'Em rota', color: '#9b59b6', next: 'Concluir' };
      case 'cancelled': return {label: 'Cancelado', color: '#ea1d2c', next: null}
      default: return { label: 'Entregue', color: '#2ecc71', next: null };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.idRow}>
          <Text style={styles.orderId}>#{id}</Text>
          <View style={[styles.badgeStatus, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>
        <Text style={styles.time}>{horario}</Text>
      </View>

      <Text style={styles.clientName}>{cliente}</Text>

      {itens.map((item, index) => (
        <View key={index} style={styles.itemLine}>
          <View style={styles.itemLeft}>
            <View style={styles.qtyBox}>
              <Text style={styles.qtyText}>{item.quantity}</Text>
            </View>
            <Text style={styles.itemsText} numberOfLines={1}>{item.product?.name}</Text>
          </View>
          <Text style={styles.itemPrice}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
        </View>

        <View style={styles.actionButtons}>
          {statusInfo.next && (
            <TouchableOpacity 
              style={[styles.nextButton, { backgroundColor: statusInfo.color }]} 
              onPress={handleUpdateStatus}
            >
              {loading ? (
                  <>
                    <Text style={styles.nextButtonText}>{statusInfo.next}</Text>
                    <ActivityIndicator color='#fff'/>
                  </>
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>{statusInfo.next}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFF" />
                  </>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.detailsButton}>
            <Ionicons name="eye-outline" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 6,
    borderLeftColor: MAIN_COLOR,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderId: {
    color: '#999',
    fontSize: 13,
    fontWeight: 'bold',
  },
  badgeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  time: {
    color: '#666',
    fontSize: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qtyBox: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  qtyText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  itemsText: {
    color: '#555',
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: '#888',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSection: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  nextButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  detailsButton: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  }
});