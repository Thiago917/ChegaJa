import axios from "axios";


import admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./chegaja-84e0c-firebase-adminsdk-xxxx.json'); 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export  const sendPushNotification = async (expoPushToken, title, body, data = {}) => {

    try{
        const response = await axios.post('https://exp.host/--/api/v2/push/send' , {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data
        }, {headers:{
            Accept: 'application/json',
            "Accept-encoding": 'gzip, deflate',
            "Content-Type": 'application/json'
        }})

        const res = response.data
        console.log('notificação enviada: ', res)
    }
    catch(err){
        console.log('Erro ao enviar notificações: ',err)
    }
}