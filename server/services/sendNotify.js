import axios from "axios";
import admin from 'firebase-admin';

// 1. Pegamos a string da variável de ambiente
const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

// 2. Inicialização do Firebase (Apenas se a variável existir)
if (serviceAccountVar && !admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin inicializado com sucesso.");
    } catch (error) {
        console.error("❌ Erro ao processar FIREBASE_SERVICE_ACCOUNT:", error.message);
    }
} else if (!serviceAccountVar) {
    console.warn("⚠️ Aviso: FIREBASE_SERVICE_ACCOUNT não configurada no ambiente.");
}

// 3. Função de envio via Expo
export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
    if (!expoPushToken) return;

    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data
    };

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json'
            }
        });
        console.log('Push enviado:', response.data);
    } catch (err) {
        console.error('Erro no Push:', err.response?.data || err.message);
    }
};