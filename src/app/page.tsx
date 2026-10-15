import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { FloralCorner } from "@/components/floral-frame";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3);
    featured = (data as Product[]) ?? [];
  } catch {
    featured = [];
  }

  return (
    <div>
      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 py-16 md:py-24">
        <FloralCorner className="pointer-events-none absolute -left-6 -top-4 h-44 w-44 opacity-80" />
        <FloralCorner className="pointer-events-none absolute -bottom-8 -right-4 h-44 w-44 rotate-180 opacity-80" />
        <p className="text-xs uppercase tracking-[0.35em] text-sage">Nairobi botanical house</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-ink md:text-7xl">
          Beauty that smells like a garden after rain.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          Petal & Bloom is a floral cosmetics atelier. Honest stock, considered formulas, and checkout
          that lands as an M-Pesa prompt on your phone.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="rounded-full bg-rose-deep px-7 py-3 text-cream hover:bg-ink"
          >
            Shop the garden
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-gold/70 px-7 py-3 text-ink hover:bg-blush"
          >
            Create an account
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl">In bloom</h2>
          <Link href="/shop" className="text-sm text-rose-deep hover:underline">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-rose/30 bg-white/50 p-10 text-ink/60">
            The atelier is being dressed. Once an admin adds stock, pieces will appear here.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
