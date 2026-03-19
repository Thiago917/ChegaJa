import axios from "axios";


export  const sendPushNotification = async (expoPushToken, title, body, data = {}) => {

    try{
        const response = await axios.post('https://exp.host/--/api/v2/push/send' , {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data,
            android: {
                channelId: 'default'
            }
        }, {headers:{
            Accept: 'application/json',
            "Accept-encoding": 'gzip, deflate',
            "Content-Type": 'application/json'
        }})

        const res = response.data
    }
    catch(err){
        console.log('Erro ao enviar notificações: ',err)
    }
}