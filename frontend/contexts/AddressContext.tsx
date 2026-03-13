import api from "@/services/api";
import socket from "@/services/socket";
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
    const [address, setAddressState] = useState<AddressType[]>([]);

    const loadAddress = async () => {
        try {
            const response = await api.get(`/address`);
            const res = response.data;

            setAddressState(Array.isArray(res) ? res : res.data || []);
        } catch(err) {
            console.log('Erro ao buscar dados de endereço');
        }
    }

    const setAddress = async (id: number, updates: Partial<AddressType>) => {
        try {
            const response = await api.patch(`/update-register/${id}`, { updates });
            const res = response.data;

            if (res.error) {
                console.log(res.message);
                return;
            }
            console.log(res.message)
            setAddressState(prev => 
                prev.map(item => item.id === id ? { ...item, ...updates } : item)
            );

        } catch(err) {
            console.log('Erro ao atualizar dados de endereço');
        }
    }

    useEffect(() => {
        loadAddress();

        socket.on('updated-address', (data) => {
            setAddressState(prev => {
                const currentList = Array.isArray(prev) ? prev : [];
                return currentList.map(item => 
                    item.id === data.id ? { ...item, ...data } : item
                );
            });
        });

        socket.on('new-address-list', (newList) => {
            if(Array.isArray(newList)){
                setAddressState(newList);
            } 
        });

        return () => {
            socket.off('new-address-list');
            socket.off('new-address')
        }
    }, []);

    return(
        <AddressContext.Provider value={{address, loadAddress, setAddress}}>
            {children}
        </AddressContext.Provider>
    )
}

export const useAddress = () => useContext(AddressContext)