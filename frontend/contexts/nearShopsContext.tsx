import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@/services/api";
import * as Location from 'expo-location';
import socket from "@/services/socket";

type Shops = {
    id: number;
    name: string;
    status: boolean;
    branch: string;
    category: string;
    photo: string;
    distance: number;
    assessment: number;   
}

type nearShopsContextType = {
    stores: Shops[]
    loadNearShop: () => Promise<void>
    setNearShop: (id: number, updates: Partial<Shops>) => void
}

const NearShopsContext = createContext<nearShopsContextType>({} as nearShopsContextType);

export const NearShopsProvider = ({children} : {children: React.ReactNode}) => {

    const [stores, setStoresState] = useState<Shops[]>([])

    const getLocation = async () => {
        const {status} = await Location.requestForegroundPermissionsAsync();

        if(status != 'granted'){
            return false;
        }

        return (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
        })).coords;
    }

    const loadNearShop = async () => {
        try{

            const locate = await getLocation()
            if(!locate) {console.log('Erro na execução do nearShopsContext');return};
            const response = await api.post('/shops-near-by', {
                lat: locate.latitude,
                long: locate.longitude
            })
            const res = response.data

            if(res.error) return res.message;

            setStoresState(res)
        }   
        catch(err){
            console.log(`Erro ao carregar informações de "Shops near by" | ${err}`)
        }
    }

    const setNearShop = async (id: number, updates: Partial<Shops>) => {
        if(!stores) return;
        const prev = stores
        try{
            const response = await api.patch('/update-near-shop', {id: id, data:{updates}})
            const res = response.data

            if(res.error) return res.message

            setStoresState(prev => prev.map((shop) => shop.id === id ? {...shop, ...updates} : shop))
        }
        catch(err){
            setStoresState(prev)
            console.log('Erro ao atualizar dados da loja pelo nearShopContext | ', err)
        }

    }


    useEffect(() => {
        loadNearShop()
        
        socket.on('shop-status-change', (data) => {
            const{id, updates} = data
            setStoresState(prev => prev.map((shop) => shop.id === id ? {...shop, ...updates } : shop))
        })

        socket.on('load-near-by', (data) => {
            const{id, updates} = data
            setStoresState(prev => prev.map((shop) => shop.id === id ? {...shop, ...updates } : shop))
        })

        return () => {
            socket.off('shop-status-change')
            socket.off('load-near-by')
        }
    
    }, [])

    
    return(
        <NearShopsContext.Provider value={{stores, loadNearShop, setNearShop}}>
            {children}
        </NearShopsContext.Provider>
    )
}

export const useNears = () => useContext(NearShopsContext)