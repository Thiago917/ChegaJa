import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Keyboard,
  Modal, 
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import api from '@/services/api';
import { router } from 'expo-router';

// Cor principal do ChegaJá vinda do .env ou padrão
const MAIN_COLOR = process.env.EXPO_PUBLIC_MAIN_COLOR || '#ff8c00';

interface PickupVerificationModalProps {
  isVisible: boolean;
  pushToken: string;
  onClose: () => void;
  onVerify: (pin: string) => Promise<void>; // Função que chama o Fastify
  orderId: number;
  status: string;
}

export default function PickupVerificationModal({ 
  isVisible,
  pushToken, 
  onClose, 
  orderId,
  status

}: PickupVerificationModalProps) {
  
  const CODE_LENGTH = 4;
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (isVisible) {
      setCode(new Array(CODE_LENGTH).fill(''));
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  }, [isVisible]);

  const handleInputChange = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, '');
    
    const newCode = [...code];
    newCode[index] = numericText.split('').pop() || '';
    setCode(newCode);
    setError(null);

    if (newCode[index] && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(input => input !== '') && index === CODE_LENGTH - 1) {
      Keyboard.dismiss();
      submitPin(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitPin = async (pinToSubmit: string) => {
    if (pinToSubmit.length !== CODE_LENGTH) {
      setError('O código deve ter 4 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
        if(status === 'collecting'){

            const response = await api.post('/verify-pickup', {
                orderId: orderId,
                pin: pinToSubmit
            })

            const res = response.data
            
            if(res.error){
                setError(res.message || 'Código inválido. Tente novamente.');
                setCode(new Array(CODE_LENGTH).fill(''));
                return;
            }

            Alert.alert('Sucesso', `${res.message}`)

            await api.post('/send-notify', {
                title: 'O entregador coletou seu pedido',
                body: 'Em alguns minutos seu pedido irá chegar no seu endereço, fique atento! Informe o código de entrega para o entregador finalizar o pedido',
                token: pushToken 
            });

            return onClose();
        }
        else if(status === 'shipped'){
            
            const response = await api.post('/verify-delivery', {
                orderId: orderId,
                pin: pinToSubmit
            })

            const res = response.data
            console.log(res)
            if(res.error){
                setError(res.message || 'Código inválido. Tente novamente.');
                setCode(new Array(CODE_LENGTH).fill(''));
                return;
            }

            Alert.alert('Sucesso', `${res.message}`)

            await api.post('/send-notify', {
                title: 'Bom apetite! 😋',
                body: 'Seu pedido foi entregue. Avalie-nos no app!',
                token: pushToken 
            });

            onClose();

            return router.replace('/driver/delivery') 

        }
        
    } catch (err: any) {
      setError(err.message || 'Código inválido. Tente novamente.');
      setCode(new Array(CODE_LENGTH).fill(''));
    } finally {
      setLoading(false);
    }
  };

    return (
    <Modal
        visible={isVisible}
        animationType="none"
        transparent={true}
        onRequestClose={onClose}
    >
    {/* KeyboardAvoidingView deve envolver o conteúdo que precisa subir */}
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      >
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeOutDown.duration(200)}
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          {/* Opcional: Adicione um ScrollView simples se o celular for muito pequeno */}
          <ScrollView
            bounces={false} 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
                {status === 'collecting' ? (
                    <Text style={styles.title}>Validação de Coleta</Text>
                ) : (
                    <Text style={styles.title}>Validação de Entrega</Text>
                )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Conteúdo do Modal (Instrução + PIN) */}
            <View style={styles.instructionContainer}>
              <MaterialCommunityIcons name="storefront-outline" size={40} color={MAIN_COLOR} />
              {status === 'collecting' ? (
                  <Text style={styles.instructionText}>Peça ao lojista o código de 4 dígitos para o pedido <Text style={styles.orderId}>#{orderId}</Text></Text>
              ) : (
                  <Text style={styles.instructionText}>Peça ao cliente o código de 4 dígitos para o pedido <Text style={styles.orderId}>#{orderId}</Text></Text>
              )}
            </View>

            <View style={styles.pinContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {inputRefs.current[index] = ref as TextInput }}
                  style={[
                    styles.pinInput, 
                    digit ? { borderColor: MAIN_COLOR } : null,
                    error ? { borderColor: '#e74c3c' } : null
                  ]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleInputChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={[styles.btnVerify, loading ? styles.btnDisabled : null]} 
              onPress={() => submitPin(code.join(''))}
              disabled={loading || code.some(d => d === '')}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>CONFIRMAR</Text>}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </Modal>
);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escurecido
    justifyContent: 'flex-end', // Modal sobe do fundo (estilo BottomSheet)
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    minHeight: 350,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E9', // Fundo leve laranja
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    gap: 15,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  orderId: {
    fontWeight: 'bold',
    color: '#333',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  pinInput: {
    width: 60,
    height: 70,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 12,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    backgroundColor: '#F9F9F9',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  btnVerify: {
    backgroundColor: MAIN_COLOR,
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 'auto', // Empurra para o final do modal
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});