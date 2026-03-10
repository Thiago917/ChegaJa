import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SelectList } from 'react-native-dropdown-select-list';
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadImageAsync } from "@/services/uploadImages";
import { useShop } from "@/contexts/ShopContext";

type Props = {
    visible: boolean,
    onClose: () => void;
}

const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR;

export default function RegisterProduct({visible, onClose}:Props) {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string>('');
  const {shop} = useShop();

  const handleSave = async () => {
    setLoading(true)
    try{
        const data ={
          name: name,
          price: parseFloat(price.replace(',','.')),
          category: selected,
          photo: image
        }

        const response = await api.post('/register-product', {data})
        const res = response.data

        if(res.error){
            setLoading(false);
            Alert.alert('Erro', res.message);
            return;
        }

        setLoading(false)
        Alert.alert('Sucesso', res.message);
        resetStates()

    }
    catch(err){
        setLoading(false)
        Alert.alert('Erro', 'Erro ao cadastrar novo produto')
    }
  }

  const compressPhoto = async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: {width: 800}}],
          {compress: 0.7, format: ImageManipulator.SaveFormat.JPEG}
      )

      return result.uri;
  }

  const pickImage = async () => {
      setLoading(true)
      try{
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
          });
          if(!result.canceled){
              setLoading(true)
              const uri = result.assets[0].uri

              const compressURI = await compressPhoto(uri);
              const imageUrl = await uploadImageAsync(compressURI, String(shop?.id), name)
              if(imageUrl.error){
                  setLoading(false)
                  return Alert.alert('Erro', imageUrl.description)
              } 
              setImage(String(imageUrl.url))
              setLoading(false)
              return;
          }
      }
      catch(err){
          console.log('Erro ao abrir a galeria: ', err)
      }
  }

  const resetStates = () => {
    setName('');
    setPrice('');
    setSelected('');
    setImage('');
    onClose();
    setLoading(false)
    setStep(1); 
  }

  const changeStep = () => {

    if(step === 1 && (name === '' || price === '' || selected === '')) return Alert.alert('Erro', 'Preencha todas as informações antes de passar de etapa')

    setLoading(true)
    setTimeout(() => {
      setStep(step + 1)
      setLoading(false)
    }, 800)
  } 

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {onClose(); setImage('')}}>
      <View style={styles.modalContainer}>

          <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Produto</Text>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => { onClose(); setImage(''); }}>
                  <Ionicons name='close' size={28} color={'red'} />
              </TouchableOpacity>
          </View>

          <View style={styles.stepperContainer}>
              <View style={[styles.stepLine, { backgroundColor: step >= 1 ? MAIN_COLOR : '#EEE' }]} />
              <View style={[styles.stepLine, { backgroundColor: step >= 2 ? MAIN_COLOR : '#EEE' }]} />
              <View style={[styles.stepLine, { backgroundColor: step >= 3 ? MAIN_COLOR : '#EEE' }]} />
          </View>

          {step === 1 ? (
              <View>
                  <Text style={styles.label}>Nome do Produto</Text>
                  <TextInput style={styles.input} placeholder="Ex: Marmita de Churrasco"  placeholderTextColor={'gray'} value={name} onChangeText={(text) => setName(text)}/>

                  <Text style={styles.label}>Preço (R$)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholder="0,00" placeholderTextColor={'gray'} value={price} onChangeText={(text) => setPrice(text)} />

                  <Text style={styles.label}>Categoria</Text>
                  <SelectList setSelected={(val:string) => setSelected(val)} data={[
                      {key: '1', value: 'Marmitas'},
                      {key: '2', value: 'Bebidas'},
                      {key: '3', value: 'Sobremesas'},
                  ]} save={'value'} placeholder="Selecione uma categoria" searchPlaceholder="Digite para pesquisar"/>
              </View>
          ) : step === 2 ? (
              <>
                  <View style={styles.container}>
                      <Text style={styles.label}>Foto do Produto</Text>
                      <Text style={styles.subtitle}>Uma boa foto ajuda a vender mais!</Text>

                      <TouchableOpacity 
                          style={[styles.uploadCard, !image && styles.dashedBorder]} 
                          onPress={() => pickImage()}
                          activeOpacity={0.7}
                      >
                          {image ? (
                          <View style={styles.imageWrapper}>
                              <Image source={{ uri: image }} style={styles.imagePreview} />
                              <View style={[styles.editBadge, { backgroundColor: MAIN_COLOR }]}>
                              <Ionicons name="pencil" size={16} color="#FFF" />
                              </View>
                          </View>
                          ) : (
                          <View style={styles.placeholderContainer}>
                              <View style={[styles.iconCircle, { backgroundColor: MAIN_COLOR + '15' }]}>
                              <Ionicons name="camera" size={32} color={MAIN_COLOR} />
                              </View>
                              <Text style={styles.placeholderText}>Clique para selecionar uma foto</Text>
                              <Text style={styles.formatText}>PNG, JPG ou JPEG (Máx. 5MB)</Text>
                          </View>
                          )}
                      </TouchableOpacity>
                      
                      {image && (
                          <TouchableOpacity onPress={() => setImage('')} style={styles.removeBtn}>
                          <Text style={styles.removeText}>Remover foto</Text>
                          </TouchableOpacity>
                      )}
                  </View>
              </>
          ): (
              <>
                  <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                      <Text style={[styles.label, {fontSize: 20, bottom: 30}]}>Resumo do produto</Text>
                      <TouchableOpacity 
                          style={[styles.uploadCard, !image && styles.dashedBorder]} 
                          activeOpacity={0.7}
                      >
                          {image ? (
                          <View style={styles.imageWrapper}>
                              <Image source={{ uri: image }} style={styles.imagePreview} />
                              <View style={[styles.editBadge, { backgroundColor: MAIN_COLOR }]}>
                              <Ionicons name="pencil" size={16} color="#FFF" />
                              </View>
                          </View>
                          ) : (
                          <View style={styles.placeholderContainer}>
                              <View style={[styles.iconCircle, { backgroundColor: MAIN_COLOR + '15' }]}>
                              <Ionicons name="camera" size={32} color={MAIN_COLOR} />
                              </View>
                              <Text style={styles.placeholderText}>Clique para selecionar uma foto</Text>
                              <Text style={styles.formatText}>PNG, JPG ou JPEG (Máx. 5MB)</Text>
                          </View>
                          )}
                      </TouchableOpacity>
                  </View>
                  <View style={{gap: -10}}>
                      <Text style={styles.label}>Produto:  {name}</Text>
                      <Text style={styles.label}>Preço:  R${price}</Text>
                      <Text style={styles.label}>Categoria:  {selected}</Text>
                  </View>
              </>
          )}
          
          <View style={styles.modalFooter}>
            {step > 1 && (
                <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.btnBack}>
                    <Text style={styles.btnBackText}>Voltar</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btnNext, { backgroundColor: MAIN_COLOR }]} onPress={() => step < 3 ? changeStep() : handleSave()}>
                {loading? (
                    <ActivityIndicator color='white'/>
                ) : (
                    <Text style={styles.btnNextText}>{step === 3 ? 'Finalizar' : 'Continuar'}</Text>
                )}
            </TouchableOpacity>
          </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalBtn: {
    position: 'absolute',
    right: 20, 
    top: 15,
  },
  stepperContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 60, 
  },
  stepLine: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  formScroll: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  btnNext: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnNextText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnBack: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  btnBackText: {
    color: '#666',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  container: {
    marginVertical: 20,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 15,
  },
  uploadCard: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dashedBorder: {
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  formatText: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 4,
  },
  removeBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  removeText: {
    color: '#FF3B30',
    fontWeight: '500',
  }
});