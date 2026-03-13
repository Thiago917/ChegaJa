import api from "@/services/api";
import { createContext, useContext, useEffect, useState } from "react";

export type AddressType = {
    id: number;
    logradouro: string;
    numero: string;
    bairro: string;
    complemento: string;
    cidade: string;
    cep: string;
    uf: string;
    label: string;
    isDefault: boolean;
}

type Address = {
    address: AddressType[] | null;
    loadAddress: (user_id: number) => Promise<void>;
    setAddress: (id: number, updates: Partial<AddressType>) => Promise<void>
}

const AddressContext = createContext<Address>({} as Address)

export const AddressProvider = ({children}: {children: React.ReactNode}) => {
    
    const [address, setAddressState] = useState<AddressType[] | null>(null);

    const loadAddress = async () => {
        try{
            const response = await api.get(`/address`)
            const res = response.data

            if(res.error){
                console.log(res.message)
            }

            setAddressState(res)

        }
        catch(err){
            console.log('Erro ao buscar dados de endereço de usuário')
        }

    }

    const setAddress = async (id: number, updates: Partial<AddressType>) => {
        if(!address) return;
        const prev = address

        try{
            const response = await api.patch(`/update-register/:${id}`, {updates})
            const res = response.data

            if(res.error){
                console.log(res.message)
            }

            setAddressState(prev => prev ? {...prev, ...updates} : prev) 

        }
        catch(err){
            setAddressState(prev)
            console.log('Erro ao atualizar dados de endereço do usuário')
        }
    }

    useEffect(() => {
        loadAddress()
    }, [])

    return(
        <AddressContext.Provider value={{address, loadAddress, setAddress}}>
            {children}
        </AddressContext.Provider>
    )
}

export const useAddress = () => useContext(AddressContext)