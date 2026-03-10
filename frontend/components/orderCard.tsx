import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type OrderProps = {
  id: string;
  cliente: string;
  itens: string;
  horario: string;
  valor: string;
};

export default function OrderCard({ id, cliente, itens, horario, valor }: OrderProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>#{id}</Text>
        <Text style={styles.time}>{horario}</Text>
      </View>
      
      <Text style={styles.clientName}>{cliente}</Text>
      <Text style={styles.itemsText} numberOfLines={2}>{itens}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.price}>{valor}</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Detalhes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: process.env.EXPO_PUBLIC_MAIN_COLOR, // Cor principal
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  time: {
    color: '#666',
    fontSize: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemsText: {
    color: '#777',
    fontSize: 14,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  buttonText: {
    color: process.env.EXPO_PUBLIC_MAIN_COLOR,
    fontWeight: 'bold',
    fontSize: 13,
  }
});