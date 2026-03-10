import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL
})

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('@refreshToken');
        if(token){
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    },
    (err) => Promise.reject(err)
)

export default api