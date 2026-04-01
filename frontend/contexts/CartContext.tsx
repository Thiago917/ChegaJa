import { createContext, useContext, useState, ReactNode } from 'react';
import { Products } from './MenuContext';
import { Shop } from './ShopContext';
import { Shops } from './nearShopsContext';

export type CartItem = {
  id: string;
  quantity: number;
  item: Products;
};

type CartContextType = {
  cart: CartItem[];
  removeFromCart: (productId: number) => void;
  updateQuantity: (product: Products, delta: number) => void;
  clearItemCart: (product: Products) => void;
  setCurrentShop: (shop: Shops) => void;
  currentShop: () => Shops | null;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  getCartSubtotal: () => number;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentShopData, setCurrentShopState] = useState<Shops | null>(null);

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.item.id !== productId));
  };

  const updateQuantity = (product: Products, delta: number) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.item.id === product.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;

        // 1. Se a nova quantidade for 0 ou menos, REMOVE o item do array
        if (newQuantity <= 0) {
          return prev.filter(item => item.item.id !== product.id);
        }

        // 2. Se o item existe e a quantidade é > 0, atualiza apenas a quantidade
        return prev.map(item =>
          item.item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // 3. Se o item não existe e estamos adicionando (delta > 0)
      if (delta > 0) {
        return [...prev, {
          id: `${product.id}-${Date.now()}`,
          quantity: 1,
          item: {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            photo: product.photo,
            status: product.status,
          }
        }];
      }

      return prev;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const clearItemCart = (product: Products) => {
    setCart((prev) => {
      if (!prev) return [];
        return prev.filter(item => Number(item.item.id) !== Number(product.id));
    });
  }

  const getCartItemsCount = () => {
    return cart.length;
  };

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  };

  const getCartTotal = () => {
    return getCartSubtotal(); // 8.99 é a taxa de entrega
  };

  const setCurrentShop = (shop: Shops) => {
    if (currentShopData && currentShopData.id !== shop.id) {
      setCurrentShopState({} as any)
    }
    setCurrentShopState(shop);
  }

  const currentShop = () => {
    return currentShopData;
  }

  
  return (
    <CartContext.Provider
      value={{
        cart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearItemCart,
        setCurrentShop,
        currentShop,
        getCartTotal,
        getCartItemsCount,
        getCartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }
  return context;
};
