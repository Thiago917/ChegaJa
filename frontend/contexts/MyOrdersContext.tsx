import api from "@/services/api";
import socket from "@/services/socket";
import { createContext, useContext, useEffect, useState } from "react";
import { Shop } from "./ShopContext";
import { Products } from "./MenuContext";
import { useDelivery } from "./DeliveryContext";

export type OrderItemsType = {
    id: number;
    quantity: number;
    price: number;
    product: Products
}

export type OrderType = {
    id: number;
    total: number;
    status: string;   
    orderItems: OrderItemsType[];
    shop: Shop;
    frete: number;
    pickupCode: string;
    deliveryCode: string;
}

type MyOrderType = {
    order: OrderType[] | null,
    loadOrders: () => Promise<void>
    setOrders: (id: number, update: Partial<OrderType>) => Promise<void>
}

const MyOrdersContext = createContext<MyOrderType>({} as MyOrderType);

export const MyOrdersProvider = ({children} : {children: React.ReactNode}) => {

    const [order, setOrderState] = useState<OrderType[]>([])
    const {includeDelivery, setDeliveries} = useDelivery()

    const loadOrders = async () => {
        try{

            const response = await api.get('/orders')
            const res = response.data

            if(res.error){
                console.log(res.message)
            }
            if(Array.isArray(res))setOrderState(res)
        }
        catch(err){
            console.log('Erro | ', err)
        }
    }

    const setOrders = async (id: number, update: Partial<OrderType>) => {
        if(!order) return;
        const prev = order;

        try{
            const response = await api.patch(`/update-order/${id}`,{update})
            const res = response.data

            if(res.error){
                console.log(res.message)
            }

            setOrderState((prev) => {
                if(!prev) return [];
                return prev.map((order) => order.id === id ? {...order, ...update} : order)
            })
        }
        catch(err){
            setOrderState(prev)
            console.log('Erro na atualização do pedido | ', err)
        }
    }

    useEffect(() => {
        loadOrders()

        socket.on('new-order-list', (orders) => {
            console.log('criando novo pedido na lista de pedidos')
            const validOrders = Array.isArray(orders) ? orders : []
            setOrderState(validOrders)
            
        })

        socket.on('order-updated', (order) => {
            console.log('atualizando pedido na lista de pedidos: ', order.id)
            setOrderState(prev => {
                return prev.map((item) => item.id === order.id ? {...item, ...order} : item)
            })

            if(order.status === 'preparing'){
            
                console.log('incluindo uma nova entrega na lista de entregas');
                includeDelivery(order)
            }

            if(order.status === 'shipped'){

                console.log('colocando pedido como "Indo entregar"');
                setDeliveries(order.id, {status: 'shipped'})
            }
        })

        return () => {
            socket.off("new-order-list")
            socket.off("order-updated")
        }
    }, [])

    return(
        <MyOrdersContext.Provider value={{order, setOrders, loadOrders}}>
            {children}
        </MyOrdersContext.Provider>
    )
    
}   

export const useOrders = () => useContext(MyOrdersContext)