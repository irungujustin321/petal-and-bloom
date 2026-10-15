"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/cart";
import { formatKes } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/mpesa/stk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      }),
    });
    const data = (await res.json()) as { orderId?: string; message?: string };
    if (!res.ok || !data.orderId) {
      setError(data.message || "Could not start M-Pesa payment.");
      setLoading(false);
      return;
    }
    clear();
    router.push(`/orders/${data.orderId}`);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-5xl">Checkout</h1>
        <p className="mt-6 text-ink/60">
          Your bag is empty.{" "}
          <Link href="/shop" className="text-rose-deep underline">
            Shop first
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-sage">Lipa na M-Pesa</p>
      <h1 className="mt-2 font-display text-5xl">Pay {formatKes(subtotal)}</h1>
      <p className="mt-3 text-ink/70">
        Enter the Safaricom number that should receive the STK push. Confirm with your PIN on the phone.
      </p>
      <form onSubmit={pay} className="mt-8 space-y-4 rounded-3xl border border-rose/20 bg-white/70 p-6">
        <label className="block text-sm">
          M-Pesa number
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
            className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
          />
        </label>
        {error && <p className="text-sm text-rose-deep">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-deep py-3 text-cream disabled:opacity-60"
        >
          {loading ? "Sending prompt…" : "Send STK push"}
        </button>
      </form>
      <p className="mt-4 text-xs text-ink/50">
        You need a customer account.{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>{" "}
        if the request is rejected.
      </p>
    </div>
  );
}
