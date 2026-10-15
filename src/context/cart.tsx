"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";

const STORAGE_KEY = "petal-bloom-cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.priceKes * item.quantity, 0);
    return {
      items,
      count,
      subtotal,
      add(product, quantity = 1) {
        setItems((current) => {
          const existing = current.find((i) => i.productId === product.id);
          if (existing) {
            const nextQty = Math.min(product.stock, existing.quantity + quantity);
            return current.map((i) =>
              i.productId === product.id ? { ...i, quantity: nextQty, stock: product.stock } : i,
            );
          }
          return [
            ...current,
            {
              productId: product.id,
              name: product.name,
              priceKes: product.price_kes,
              quantity: Math.min(product.stock, quantity),
              imageUrl: product.image_url,
              stock: product.stock,
            },
          ];
        });
      },
      setQuantity(productId, quantity) {
        setItems((current) =>
          current
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(0, Math.min(i.stock, quantity)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        );
      },
      remove(productId) {
        setItems((current) => current.filter((i) => i.productId !== productId));
      },
      clear() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
