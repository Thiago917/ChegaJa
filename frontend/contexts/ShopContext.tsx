import api from "@/services/api";
import { createContext, useContext, useEffect, useState } from "react";

export type Shop={
    id: string;
    name: string;
    status: boolean;
    branch: string;
    cep: string;
    photo: string;
}

type ShopContextType = {
    shop: Shop | null
    loadShopData: () => Promise<void>
    setShop: (id: string, updates: Partial<Shop>) => void;
}

const ShopContext = createContext<ShopContextType>({} as ShopContextType);

export const ShopProvider = ({children} : {children: React.ReactNode}) => {

    const [shop, setShopState] = useState<Shop | null>(null)

    const loadShopData = async () => {
        try{
            const response = await api.get('/shop');
            const res = response.data
            
            if(res.error){
                console.log(res.message)
                setShopState(null)
            }
            else{
                setShopState(res)
            }
        }
        catch(err){
            setShopState(null)
            console.log(err)
        }
    }

    const setShop = async (id: string, updates: Partial<Shop>) => {

        if(!shop) return;
        const prev = shop;
        console.log('Atualizando dados da loja | ', updates)
        try{

            const response = await api.patch(`/update-shop/${Number(id)}`, {updates})
            const res = response.data
            
            if(res.error){
                return res.message
            }
            setShopState(prev => prev? ({...prev!, ...updates}) : prev);
            return res.message
        }
        catch(err){
            
            setShopState(prev)
            console.log('Erro ao atualizar dados da loja | ', err)
        }
    }


    useEffect(() => {
        loadShopData()
    }, [])

    return(
        <ShopContext.Provider value={{shop, loadShopData, setShop}}>
            {children}
        </ShopContext.Provider>
    )
}

export const useShop = () => useContext(ShopContext)