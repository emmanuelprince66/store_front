import { createContext, useState } from "react";
import type { CartItem, Product, ProductVariation } from "../type";

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity: number,
    variation?: ProductVariation
  ) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variationId?: string
  ) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  getTotalItems: () => 0,
  getTotalPrice: () => 0,
  clearCart: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (
    product: Product,
    quantity: number,
    variation?: ProductVariation
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id && item.variation?.id === variation?.id
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [...prev, { product, variation, quantity }];
    });
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.variation?.id === variationId)
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variationId?: string
  ) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.variation?.id === variationId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const getTotalItems = () =>
    cart.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () =>
    cart.reduce((sum, item) => {
      const price =
        item.variation?.selling_price || item.product.selling_price || 0;
      return sum + price * item.quantity;
    }, 0);

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        getTotalItems,
        getTotalPrice,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
