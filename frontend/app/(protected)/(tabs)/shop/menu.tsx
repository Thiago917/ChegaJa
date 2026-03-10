import React, { useCallback, useState } from "react"
import {View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator, RefreshControl} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import RegisterProduct from "@/components/registerProduct"
import UpdateProd from "@/components/updateProduct"
import { Products, useProducts, CategoryProducts } from "@/contexts/MenuContext"

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR

export default function Menu() {
  const [search, setSearch] = useState("")
  const [visible, setVisible] = useState(false)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [updtVisible, setUpdtVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { prds, setProducts, loadProducts } = useProducts()

  const toggleAvailability = (id: number, val: boolean) => {
    Alert.alert("Selecione", "Tem certeza que quer alterar a disponibilidade?", [
      { text: "NÃO", onPress: () => setIsUpdating(null) },
      { text: "SIM", onPress: () => setProducts(id, { status: val }) }
    ])
  }

  const updateModal = (product: Products) => {
    setSelectedProduct(product)
    setUpdtVisible(true)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadProducts()
    setRefreshing(false)
  }, [])

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Meu Cardápio</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: MAIN_COLOR }]}
          onPress={() => setVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Novo Item</Text>
        </TouchableOpacity>
      </View>

      <RegisterProduct visible={visible} onClose={() => setVisible(false)} />
      <UpdateProd visible={updtVisible} onClose={() => setUpdtVisible(false)} product={selectedProduct} />

      {/* BUSCA */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          placeholder="Buscar no cardápio..."
          placeholderTextColor="gray"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList<CategoryProducts>
        data={prds}
        keyExtractor={(item) => item.category}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View>
            {/* CATEGORIA */}
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{item.category}</Text>
              <Text style={styles.categoryCount}>{item.products.length} itens</Text>
            </View>

            {/* PRODUTOS */}
            {item.products.map((product, index) => (
              <View key={product.id} style={styles.productCard}>
                <Image source={{ uri: product.photo }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <TouchableOpacity style={styles.editIcon} onPress={() => updateModal(product)}>
                      <Ionicons name="ellipsis-vertical" size={20} color="#CCC" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.productPrice}>R$ {product.price.toFixed(2).replace(".", ",")}</Text>

                  <View style={styles.productFooter}>
                    <Text style={styles.statusText}>{product.status ? "Disponível" : "Indisponível"}</Text>
                    {isUpdating === index ? (
                      <ActivityIndicator color={MAIN_COLOR} size="small" />
                    ) : (
                      <Switch
                        value={product.status}
                        trackColor={{ false: "#767577", true: MAIN_COLOR + "80" }}
                        thumbColor={product.status ? MAIN_COLOR : "#f4f3f4"}
                        onValueChange={() => toggleAvailability(product.id, !product.status)}
                      />
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 5,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 45,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 25,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  categoryCount: {
    fontSize: 12,
    color: '#AAA',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#888',
  },
  editIcon: {
    padding: 5,
  }
});