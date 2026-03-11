import { createContext, useContext, useState, ReactNode } from 'react';
import { Products } from './MenuContext';

export type CartItem = {
  id: string;
  quantity: number;
  item: Products;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Products) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (product: Products, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  getCartSubtotal: () => number;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Products) => {
    setCart(prev => {
      const findCartItem = prev.find(item => item.item.id === product.id);

      if (findCartItem) {
        return prev.map(item =>
          item.item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        quantity: 1,
        item: {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          photo: product.photo,
          status: product.status
        }
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.item.id !== productId));
  };

  const updateQuantity = (product: Products, delta: number) => {
    setCart(prev => {
      const findCartItem = prev.find(item => item.item.id === product.id);

      if (findCartItem) {
        const newQuantity = findCartItem.quantity + delta;

        if (newQuantity <= 0) {
          return prev.filter(item => item.item.id !== product.id);
        }

        return prev.map(item =>
          item.item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

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
            status: product.status
          }
        }];
      }

      return prev;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartItemsCount = () => {
    return cart.length;
  };

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  };

  const getCartTotal = () => {
    return getCartSubtotal() + 8.99; // 8.99 é a taxa de entrega
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
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
