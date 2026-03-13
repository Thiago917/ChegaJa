import { Modal, Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import api from "@/services/api";
import MaskInput from 'react-native-mask-input'
import Checkbox from "expo-checkbox";
import { useUser } from "@/contexts/UserContext";
import { AddressType, useAddress } from "@/contexts/AddressContext";

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#e74c3c';

export default function AddressLocation({ visible, onClose, address, userId }: { visible: boolean; onClose: () => void; address: AddressType | null; userId: number }) {
    
    const [street, setStreet] = useState<string>('');
    const [number, setNumber] = useState<string>('');
    const [complement, setComplement] = useState<string>('');
    const [neighborhood, setNeighborhood] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [uf, setUf] = useState<string>('');
    const [cep, setCep] = useState<string>('');
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const [addressLabel, setAddressLabel] = useState<string>('Residência');
    const [loading, setLoading] = useState<boolean>(false);

    const addressId = address?.id || null;
    const { setAddress } = useAddress()

    useEffect(() => {
        if (addressId) {
            setStreet(address?.logradouro || "");
            setNumber(address?.numero || "");
            setComplement(address?.complemento || "");
            setNeighborhood(address?.bairro || "");
            setCity(address?.cidade || "");
            setUf(address?.estado || "");
            setCep(address?.cep || "");
            setAddressLabel(address?.apelido || "Residência");
            setIsChecked(address?.isDefault || false);
        } else {
            setStreet("");
            setNumber("");
            setComplement("");
            setNeighborhood("");
            setCity("");
            setUf("");
            setCep("");
            setAddressLabel("Residência");
            setIsChecked(false);
        }
    }, [visible, address]);


    const handleSave = async () => {
        if (!street || !number || !neighborhood || !city || !cep) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }
        setLoading(true)
        try{

            if(addressId){
                await setAddress(addressId, {
                    logradouro: street,
                    numero: number,
                    complemento: complement,
                    bairro: neighborhood,
                    cidade: city, 
                    cep: cep,
                    estado: uf,
                    apelido: addressLabel,
                    isDefault: isChecked
                })
                onClose()
            }
            else{

                const response = await api.post('/register-address', {
                    street: street,
                    number: number,
                    complement: complement,
                    neighborhood: neighborhood,
                    city: city,
                    cep: cep,
                    uf: uf,
                    label: addressLabel,
                    isDefault: isChecked
                })
                const res = response.data
                
                if(res.error){
                    return Alert.alert('Erro', `${res.message}`)
                }
                
                Alert.alert('Erro', `${res.message}`)
                return onClose();
            }
        }
        catch(err){
            return console.log('Erro ao salvar endereço: ', err);
        }
        finally {
            setLoading(false)
        }
    };

    const viacep = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setLoading(true)
        try{
            const res = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json`)
            const data = res.data;
            setTimeout(() => {
                setLoading(false)
            }, 700)

            setStreet(data.logradouro);
            setNeighborhood(data.bairro);
            setCity(data.localidade);
            setUf(data.uf);
        }
        catch(err){
            setLoading(false)
            return Alert.alert('CEP inválido', 'Não foi possível encontrar o endereço para o CEP informado. Por favor, verifique o CEP e tente novamente.');
        }
    }

    const resetStates = () => {
        setStreet('');
        setNumber('');
        setComplement('');
        setNeighborhood('');
        setCity('');
        setUf('');
        setCep('');
        setIsChecked(false);
    }

    return(
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={() => {onClose()}}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Novo Endereço</Text>
                        <TouchableOpacity onPress={() => {resetStates(); onClose()}}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        
                        {/* Rótulo do Endereço */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Tipo de Endereço *</Text>
                            <View style={styles.labelOptions}>
                                {['Residência', 'Trabalho', 'Outro'].map((label) => (
                                    <TouchableOpacity
                                        key={label}
                                        style={[
                                            styles.labelButton,
                                            addressLabel === label && [styles.labelButtonActive, { backgroundColor: MAIN_COLOR }]
                                        ]}
                                        onPress={() => setAddressLabel(label)}
                                    >
                                        <Text style={[
                                            styles.labelButtonText,
                                            addressLabel === label && styles.labelButtonTextActive
                                        ]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* CEP */}
                        <View style={styles.section}>
                            <Text style={styles.label}>CEP *</Text>
                            <MaskInput
                                style={styles.input}
                                placeholder="00000-000"
                                placeholderTextColor="#CCC"
                                value={cep}
                                keyboardType="number-pad"
                                onChangeText={setCep}
                                mask={[/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/]}
                                onBlur={() => viacep(cep)}
                            />
                        </View>

                        {/* Rua e Número em linha */}
                        <View style={styles.rowContainer}>
                            <View style={[styles.section, { flex: 2, marginRight: 8 }]}>
                                <Text style={styles.label}>Rua/Avenida *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nome da rua"
                                    placeholderTextColor="#CCC"
                                    value={street}
                                    onChangeText={setStreet}
                                />
                            </View>
                            <View style={[styles.section, { flex: 1 }]}>
                                <Text style={styles.label}>Número *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123"
                                    placeholderTextColor="#CCC"
                                    keyboardType="numeric"
                                    value={number}
                                    onChangeText={setNumber}
                                />
                            </View>
                        </View>

                        {/* Complemento */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Complemento (Apto, Bloco, etc)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Apartamento, sala, etc"
                                placeholderTextColor="#CCC"
                                value={complement}
                                onChangeText={setComplement}
                            />
                        </View>

                        {/* Bairro */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Bairro *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nome do bairro"
                                placeholderTextColor="#CCC"
                                value={neighborhood}
                                onChangeText={setNeighborhood}
                            />
                        </View>

                        {/* Cidade e Estado em linha */}
                        <View style={styles.rowContainer}>
                            <View style={[styles.section, { flex: 2, marginRight: 8 }]}>
                                <Text style={styles.label}>Cidade *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="São Paulo"
                                    placeholderTextColor="#CCC"
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>
                        </View>

                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <Checkbox value={isChecked} onValueChange={() => setIsChecked(!isChecked)}/>
                            <Text>Endereço padrão</Text>
                        </View>

                        {/* Observação */}
                        <View style={styles.note}>
                            <Ionicons name="information-circle" size={16} color="#888" />
                            <Text style={styles.noteText}>Campos marcados com * são obrigatórios</Text>
                        </View>

                    </ScrollView>

                    {/* Botões */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: MAIN_COLOR }]}
                            onPress={handleSave}
                        >
                            {loading? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>{addressId ? 'Alterar Endereço' : 'Cadastrar Endereço'}</Text>
                            ) }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 16,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    section: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#FAFAFA',
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    labelOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    labelButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
    },
    labelButtonActive: {
        borderColor: MAIN_COLOR
    },
    labelButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    labelButtonTextActive: {
        color: '#FFF',
    },
    note: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    noteText: {
        fontSize: 12,
        color: '#888',
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 20,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
});