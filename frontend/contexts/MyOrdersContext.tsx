import api from "@/services/api";
import socket from "@/services/socket";
import { createContext, useContext, useEffect, useState } from "react";
import { Shop } from "./ShopContext";
import { Products } from "./MenuContext";

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
}

type MyOrderType = {
    order: OrderType[] | null,
    loadOrders: () => Promise<void>
    setOrders: (id: number, update: Partial<OrderType>) => Promise<void>
}

const MyOrdersContext = createContext<MyOrderType>({} as MyOrderType);

export const MyOrdersProvider = ({children} : {children: React.ReactNode}) => {

    const [order, setOrderState] = useState<OrderType[]>([])

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
            const validOrders = Array.isArray(orders) ? orders : []
            setOrderState(validOrders)
        })

        socket.on('order-updated', (order) => {
            setOrderState(prev => {
                return prev.map((item) => item.id === order.id ? {...item, ...order} : item)
            })
        })
    }, [])

    return(
        <MyOrdersContext.Provider value={{order, setOrders, loadOrders}}>
            {children}
        </MyOrdersContext.Provider>
    )
    
}   

export const useOrders = () => useContext(MyOrdersContext)