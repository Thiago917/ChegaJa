// MenuContext.tsx
import api from "@/services/api"
import socket from "@/services/socket"
import { createContext, useContext, useEffect, useState } from "react"

export type Products = {
  id: number
  name: string
  price: number
  status: boolean
  quantity?: number;
  photo: string
  category: string
  created_at?: string
}

export type CategoryProducts = {
  category: string
  products: Products[]
}

type MenuContextType = {
  prds: CategoryProducts[]
  loadProducts: () => Promise<void>
  setProducts: (id: number, updates: Partial<Products>) => void
}

const MenuContext = createContext<MenuContextType>({} as MenuContextType)

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [prds, setPrds] = useState<CategoryProducts[]>([])

  const loadProducts = async () => {
    try {
      const response = await api.get("/products")
      const res = response.data

      if (res.error) {
        console.log("Erro no carregamento dos produtos |", res.message)
        return
      }

      setPrds(res.response as CategoryProducts[])
    } catch (err) {
      console.log("Erro ao buscar produtos |", err)
    }
  }

  const setProducts = async (id: number, updates: Partial<Products>) => {

    if(!prds) return;
  
    const prev = prds

    try{
      const response = await api.patch('/update-menu', {id, data:{updates}})
      const res = response.data

      if(res.error){
        setPrds(prev)
        console.log(res.message)
      }
      
      setPrds(prev =>
        prev.map(category => ({
          ...category,
          products: category.products.map(product =>
            product.id === id ? { ...product, ...updates } : product
          )
        }))
      )

    }
    catch(err){
      setPrds(prev)
      console.log(err)
    }
  }

  useEffect(() => {
    loadProducts()

    socket.on("render-new-product", (data) => {
      const { product_id } = data
      setPrds(prev =>
        prev.map(cat => ({
          ...cat,
          products: cat.products.map(p =>
            p.id === product_id ? { ...p, ...data } : p
          )
        }))
      )
    })

    socket.on("all-prds", (data) => {
      setPrds(data as CategoryProducts[])
    })

    return () => {
      socket.off("render-new-product")
      socket.off("all-prds")
    }
  }, [])

  return (
    <MenuContext.Provider value={{ prds, loadProducts, setProducts }}>
      {children}
    </MenuContext.Provider>
  )
}

export const useProducts = () => useContext(MenuContext)




