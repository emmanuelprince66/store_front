import { cartLineDiscount } from "../utils/discountTiers";
import { getAllowSalesWithoutStock, maxOrderQuantity } from "../utils/stock";
import { createContext, useState } from "react";
import type { CartItem, Product, ProductVariation } from "../type";

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity: number,
    variation?: ProductVariation,
  ) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variationId?: string,
  ) => void;
  getTotalItems: () => number;
  /** Cart total after volume (bulk) discounts. */
  getTotalPrice: () => number;
  /** What the volume discounts take off. */
  getTotalDiscount: () => number;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  getTotalItems: () => 0,
  getTotalPrice: () => 0,
  getTotalDiscount: () => 0,
  clearCart: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (
    product: Product,
    quantity: number,
    variation?: ProductVariation,
  ) => {
    setCart((prev) => {
      // Check if this exact product + variation combo exists
      const existingIndex = prev.findIndex((item) => {
        if (variation) {
          // For products with variations, match by variation ID
          return item.variation?.id === variation.id;
        } else {
          // For simple products, match by product ID and ensure no variation
          return item.product.id === product.id && !item.variation;
        }
      });

      if (existingIndex !== -1) {
        // Update quantity of existing item
        const updated = [...prev];
        const maxQuantity = maxOrderQuantity(
          variation?.quantity ?? product.quantity,
          getAllowSalesWithoutStock(),
          999,
        );
        updated[existingIndex].quantity = Math.min(
          updated[existingIndex].quantity + quantity,
          maxQuantity,
        );
        return updated;
      }

      // Add new item to cart
      return [...prev, { product, variation, quantity }];
    });
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (variationId) {
          // Remove by variation ID
          return item.variation?.id !== variationId;
        } else {
          // Remove by product ID (for simple products)
          return !(item.product.id === productId && !item.variation);
        }
      }),
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variationId?: string,
  ) => {
    if (quantity < 1) {
      removeFromCart(productId, variationId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        // Match by variation ID if provided, otherwise by product ID
        const isMatch = variationId
          ? item.variation?.id === variationId
          : item.product.id === productId && !item.variation;

        if (isMatch) {
          const maxQuantity = maxOrderQuantity(
            item.variation?.quantity ?? item.product.quantity,
            getAllowSalesWithoutStock(),
            999,
          );
          return { ...item, quantity: Math.min(quantity, maxQuantity) };
        }
        return item;
      }),
    );
  };

  const getTotalItems = () =>
    cart.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () =>
    cart.reduce((sum, item) => sum + cartLineDiscount(item).subtotal, 0);

  const getTotalDiscount = () =>
    cart.reduce((sum, item) => sum + cartLineDiscount(item).totalDiscount, 0);

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
        getTotalDiscount,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
