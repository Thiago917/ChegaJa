import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
    visible: boolean;
    onClose: () => void
    onSelect: (status: boolean) => void
}
export default function ToggleShopStatus({visible, onSelect, onClose}: Props){
    return(
        <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.dropdownMenu}>
                    <Text style={styles.dropdownTitle}>Alterar status da loja</Text>
                    
                    <TouchableOpacity style={styles.dropdownItem} onPress={() => onSelect(true)}>
                        <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>● Disponível (Aberto)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dropdownItem} onPress={() => onSelect(false)}>
                        <Text style={{ color: '#C62828', fontWeight: 'bold' }}>● Indisponível (Fechado)</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>  
    )
}

const styles = StyleSheet.create({
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
})