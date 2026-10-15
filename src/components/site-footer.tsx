"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-rose/20 bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">Petal & Bloom</p>
          <p className="mt-3 max-w-xs text-sm text-cream/70">
            A Nairobi botanical beauty house. Floral formulas, honest stock, M-Pesa at checkout.
          </p>
        </div>
        <div className="text-sm text-cream/75">
          <p className="mb-3 font-medium text-gold">Visit</p>
          <p>The Garden Atelier</p>
          <p>Westlands, Nairobi</p>
          <p className="mt-2">hello@petalbloom.shop</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium text-gold">Account</p>
          <div className="flex flex-col gap-2 text-cream/75">
            <Link href="/login">Customer sign in</Link>
            <Link href="/admin/login">Staff console</Link>
            <Link href="/shop">The collection</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
