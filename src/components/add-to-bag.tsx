"use client";

import { useState } from "react";
import { useCart } from "@/context/cart";
import type { Product } from "@/lib/types";

export function AddToBag({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (product.stock < 1) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-ink/20 px-6 py-3 text-ink/50"
      >
        Sold out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(product, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
      className="w-full rounded-full bg-rose-deep px-6 py-3 text-cream transition hover:bg-ink"
    >
      {added ? "Added to bag" : "Add to bag"}
    </button>
  );
}
