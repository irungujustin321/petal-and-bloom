"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/cart";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setEmail(data.user?.email ?? null);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user?.email ?? null);
      });
      return () => sub.subscription.unsubscribe();
    } catch {
      return undefined;
    }
  }, []);

  if (pathname.startsWith("/admin")) return null;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-rose/20 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 bg-blush text-rose-deep">
            ✿
          </span>
          <span className="font-display text-2xl tracking-tight text-ink">
            Petal & Bloom
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink/80 md:flex">
          <Link href="/shop" className="hover:text-rose-deep">
            Shop
          </Link>
          <Link href="/shop?category=skincare" className="hover:text-rose-deep">
            Skincare
          </Link>
          <Link href="/shop?category=fragrance" className="hover:text-rose-deep">
            Fragrance
          </Link>
          <Link href="/orders" className="hover:text-rose-deep">
            Orders
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/cart" className="relative rounded-full border border-rose/30 px-3 py-1.5 hover:bg-blush">
            Bag
            {count > 0 && (
              <span className="ml-1 rounded-full bg-rose-deep px-1.5 text-[11px] text-cream">
                {count}
              </span>
            )}
          </Link>
          {email ? (
            <button
              type="button"
              onClick={signOut}
              className="hidden rounded-full px-3 py-1.5 text-ink/70 hover:text-rose-deep sm:inline"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-rose-deep px-4 py-1.5 text-cream hover:bg-ink"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
