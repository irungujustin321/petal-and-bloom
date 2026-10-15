import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  let products: Product[] = [];
  try {
    const supabase = await createClient();
    let query = supabase.from("products").select("*").eq("is_active", true).order("name");
    if (category) query = query.eq("category", category);
    const { data } = await query;
    products = (data as Product[]) ?? [];
  } catch {
    products = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-sage">The collection</p>
      <h1 className="mt-2 font-display text-5xl">Shop botanicals</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={`rounded-full px-4 py-1.5 text-sm ${!category ? "bg-rose-deep text-cream" : "border border-rose/30 bg-white/70"}`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/shop?category=${c.slug}`}
            className={`rounded-full px-4 py-1.5 text-sm ${category === c.slug ? "bg-rose-deep text-cream" : "border border-rose/30 bg-white/70"}`}
          >
            {c.label}
          </Link>
        ))}
      </div>
      {products.length === 0 ? (
        <p className="mt-12 text-ink/60">Nothing in this aisle yet. Ask the atelier to restock.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
