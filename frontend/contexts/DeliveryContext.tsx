import api from "@/services/api";
import { createContext, useContext, useEffect, useState } from "react";
import { AddressType } from "./AddressContext";
import * as Location from 'expo-location';
import { OrderItemsType, OrderType } from "./MyOrdersContext";
import { Shop } from "./ShopContext";
import { Shops } from "./nearShopsContext";
import { User } from "./UserContext";


export type OrderData = {
    id: number;
    frete: number;
    total: number;
    status: string;
    shop: Shops
    distance_origin: {
        distance: string;
        time: string;
    },
    distance_destin: {
        distance: string;
        time: string;
    },
    user: User,
}

type DeliveryContextType = {
    deliveries: OrderData[]; 
    activeDelivery: OrderData | undefined
    loadDeliveries: () => Promise<void>;
    handleTimeoutCard: (id: number) => void
    includeDelivery: (order: OrderType) => void
    setDeliveries: (id: number, updates: Partial<OrderData>) => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextType>({} as DeliveryContextType);

export const DeliveryProvider = ({ children }: { children: React.ReactNode }) => {
    const [deliveries, setDeliveriesState] = useState<OrderData[]>([]);

    const getLocation = async () => {
        const {status} = await Location.requestForegroundPermissionsAsync();

        if(status != 'granted'){
            return false;
        }

        return (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
        })).coords;
    }

    const loadDeliveries = async () => {
        try {
            console.log('carregando entregas disponíveis...')
            const locate = await getLocation();
            if(!locate){
                console.log('Erro ao pegar lat e lng do motoboy')
                return;
            }
            const response = await api.post('/delivery-orders', {
                driverLat: locate.latitude,
                driverLng: locate.longitude
            });
            const res = response.data;
            
            const data = Array.isArray(res) ? res : res.orders;
            setDeliveriesState(data || []);
        } catch (err) {
            console.log('Erro ao buscar pedidos para entrega | ', err);
        }
    };

    const setDeliveries = async (id: number, updates: Partial<OrderData>) => {
        const previousState = [...deliveries];
        try {
            const response = await api.patch(`/update-delivery/${id}`, {updates});
            const res = response.data
            if (res.error) {
                throw new Error(response.data.message);
            }
            
            setDeliveriesState(prev => 
                prev.map(item => item.id === id ? { ...item, ...updates } : item)
            );

            console.log(res.message)
        } catch (err) {
            setDeliveriesState(previousState);
            console.log('Erro ao atualizar dados da entrega | ', err);
        }
    };

    const deliveryDetails = async (id: number, driverLat: number, driverLng: number) => {
        
            const response = await api.post('/delivery-details', {
                id: id,
                driverLat: driverLat,
                driverLng: driverLng
            })
            const res = response.data

            if(res.error){
                console.log(res.message)
                return;
            }

            return res

    }

    const handleTimeoutCard = (id: number) => {
        setDeliveriesState(prev => prev.filter(order => order.id !== id))
    }

    async function includeDelivery (order: OrderType){
        if(!order) return;

        try{
            const locate = await getLocation();
            if(!locate){
                console.log('Erro ao pegar lat e lng do motoboy')
                return;
            }

            const res = await deliveryDetails(order.id, locate.latitude, locate.longitude)

            setDeliveriesState((prev) => {
                const alreadyExists = prev.some(item => item.id === order.id);
                if (alreadyExists) return prev;
                
                return [...prev, res];
            });
        }
        catch(err){
            console.log('Erro ao mandar dados da nova entrega para o entregador | ',err)
        }
    }

    const activeDelivery = deliveries.find((e) => e.status === 'collecting' || e.status === 'shipped')
    
    useEffect(() => {
        loadDeliveries();
    }, []);

    return (
        <DeliveryContext.Provider value={{ deliveries, loadDeliveries, setDeliveries, handleTimeoutCard, includeDelivery, activeDelivery }}>
            {children}
        </DeliveryContext.Provider>
    );
};

export const useDelivery = () => useContext(DeliveryContext);