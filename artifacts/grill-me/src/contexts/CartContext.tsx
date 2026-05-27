import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  jerseyId: number;
  jerseyName: string;
  teamName: string;
  imageUrl: string;
  price: number;
  size: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (jerseyId: number, size: string) => void;
  updateQuantity: (jerseyId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('saifit-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('saifit-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.jerseyId === item.jerseyId && i.size === item.size);
      if (existing) {
        return prev.map(i => 
          (i.jerseyId === item.jerseyId && i.size === item.size) 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (jerseyId: number, size: string) => {
    setCart(prev => prev.filter(i => !(i.jerseyId === jerseyId && i.size === size)));
  };

  const updateQuantity = (jerseyId: number, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(jerseyId, size);
      return;
    }
    setCart(prev => prev.map(i => 
      (i.jerseyId === jerseyId && i.size === size) 
        ? { ...i, quantity }
        : i
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
