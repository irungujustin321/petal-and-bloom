"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart";
import { formatKes } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, setQuantity, remove } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-5xl">Your bag</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-ink/60">
          Empty for now.{" "}
          <Link href="/shop" className="text-rose-deep underline">
            Wander the collection
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-3xl border border-rose/20 bg-white/70 p-4"
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-blush">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-center">
                <div>
                  <p className="font-display text-2xl">{item.name}</p>
                  <p className="text-sm text-rose-deep">{formatKes(item.priceKes)}</p>
                </div>
                <div className="mt-3 flex items-center gap-3 sm:mt-0">
                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                    className="w-16 rounded-full border border-rose/30 bg-cream px-3 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="text-sm text-ink/50 hover:text-rose-deep"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-rose/20 pt-6">
            <p className="text-ink/70">Subtotal</p>
            <p className="font-display text-3xl">{formatKes(subtotal)}</p>
          </div>
          <Link
            href="/checkout"
            className="inline-block rounded-full bg-rose-deep px-8 py-3 text-cream hover:bg-ink"
          >
            Checkout with M-Pesa
          </Link>
        </div>
      )}
    </div>
  );
}
