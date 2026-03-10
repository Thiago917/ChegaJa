import { Products, useProducts } from "@/contexts/MenuContext";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Alert, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { useEffect, useState } from "react";
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { uploadImageAsync } from "@/services/uploadImages";

type Props = {
    product: Products | null
    visible: boolean;
    onClose: () => void
}

// ... (mantenha os imports)

export default function UpdateProd({ product, visible, onClose }: Props) {
    if (!product) return null;

    const [productName, setProductName] = useState<string>('');
    const [productPrice, setProductPrice] = useState<string>('');
    const [productCategory, setProductCategory] = useState<string>('');
    const [productStatus, setProductStatus] = useState<boolean>(false);
    const [productPhoto, setProductPhoto] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const {setProducts} = useProducts()

    const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c';

    useEffect(() => {
        if (visible && product) {
            setProductName(product.name);
            setProductPrice(product.price.toString());
            setProductCategory(product.category);
            setProductStatus(product.status);
            setProductPhoto(product.photo);
        }
    }, [visible, product]);

    const handleUpdate = async () => {
        try {
            setLoading(true);

            await setProducts(product.id, {
                name: productName,
                price: parseFloat(productPrice.replace(',', '.')),
                category: productCategory,
                status: productStatus,
                photo: productPhoto
            })
            
            Alert.alert('Sucesso', 'Produto atualizado!');
            onClose();
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível atualizar o produto.');
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (prod_id: number) => {
        try {
            const response = await api.delete(`/delete-product/${prod_id}`);
            if (response.data.error) return Alert.alert('Erro', response.data.message);
            
            Alert.alert('Sucesso', 'Produto removido!');
            onClose();
        } catch (err) {
            Alert.alert('Erro', 'Falha ao deletar.');
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const compressURI = await compressPhoto(uri);
                // Aqui você usa o nome do produto atualizado
                setLoading(true)
                const imageUrl = await uploadImageAsync(compressURI, String(product.id), productName);
                if (imageUrl.error) {setLoading(false); return Alert.alert('Erro', imageUrl.description)};
                setProductPhoto(String(imageUrl.url));
                setLoading(false)
            }
        } catch (err) {
            console.log('Erro ao abrir a galeria: ', err);
        }
    };

    const compressPhoto = async (uri: string) => {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 600 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.dropdownMenu}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.dropdownTitle}>Editar Produto</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.imageSection}>
                        <TouchableOpacity 
                            style={[styles.uploadCard, !productPhoto && styles.dashedBorder]} 
                            onPress={pickImage}
                        >
                            {productPhoto ? (
                                <View style={styles.imageWrapper}>
                                    <Image source={{ uri: productPhoto }} style={styles.imagePreview} contentFit="cover" />
                                    <View style={[styles.editBadge, { backgroundColor: MAIN_COLOR }]}>
                                        <Ionicons name="camera" size={18} color="#FFF" />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.placeholderContainer}>
                                    <Ionicons name="cloud-upload-outline" size={40} color="#CCC" />
                                    <Text style={styles.placeholderText}>Adicionar Foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome do produto</Text>
                            <TextInput style={styles.input} value={productName} onChangeText={setProductName} />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Preço (R$)</Text>
                            <TextInput 
                                style={styles.input} 
                                keyboardType="numeric" 
                                value={productPrice} 
                                onChangeText={setProductPrice} 
                            />
                        </View>

                        <View style={[styles.inputGroup, { zIndex: 999 }]}>
                            <Text style={styles.label}>Categoria</Text>
                            <SelectList 
                                setSelected={setProductCategory} 
                                data={[
                                    { key: 'Marmitas', value: 'Marmitas' },
                                    { key: 'Bebidas', value: 'Bebidas' },
                                    { key: 'Sobremesas', value: 'Sobremesas' },
                                ]} 
                                save="value" 
                                defaultOption={{ key: productCategory, value: productCategory }}
                                boxStyles={styles.selectBox}
                            />
                        </View>

                        <View style={styles.statusRow}>
                            <Text style={styles.label}>Disponível para venda</Text>
                            <Switch 
                                value={productStatus} 
                                trackColor={{ false: "#DDD", true: MAIN_COLOR + '80' }} 
                                thumbColor={productStatus ? MAIN_COLOR : "#f4f3f4"} 
                                onValueChange={setProductStatus} 
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.rm_btn} 
                            onPress={() => {
                                Alert.alert('Atenção', 'Excluir este produto permanentemente?', [
                                    { text: 'Cancelar', style: 'cancel' },
                                    { text: 'Excluir', style: 'destructive', onPress: () => deleteProduct(product.id) }
                                ]);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.confirm_btn, { flex: 1, marginLeft: 10 }]} 
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.btnText}>Salvar Alterações</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownMenu: {
        width: '90%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
      },
    dashedBorder: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderStyle: 'dashed',
    },
    imageSection: {
        alignItems: 'center',
        marginVertical: 20,
    },
uploadCard: {
        width: 200, 
        height: 150,
        borderRadius: 75, 
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 70, 
    },
    editBadge: {
        position: 'absolute', // Mágica acontece aqui: flutua sobre a imagem
        bottom: 5, // Distância do fundo
        right: 5, // Distância da direita
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5, // Sombra para Android
        shadowColor: '#000', // Sombra para iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 10, // Garante que fique por cima de tudo no iOS
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 12,
        color: '#AAA',
        marginTop: 5,
    },
    form: {
        gap: 15,
    },
    inputGroup: {
        gap: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingVertical: 8,
        fontSize: 16,
        color: '#333',
    },
    selectBox: {
        borderColor: '#EEE',
        borderRadius: 8,
        marginTop: 5,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 30,
    },
    rm_btn: {
        backgroundColor: '#FF3B30',
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirm_btn: {
        backgroundColor: '#28a745',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});