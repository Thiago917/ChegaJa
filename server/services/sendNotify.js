import axios from "axios";

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