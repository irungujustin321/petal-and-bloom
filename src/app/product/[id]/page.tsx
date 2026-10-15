import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToBag } from "@/components/add-to-bag";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { formatKes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const product = data as Product;

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 lg:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center font-display text-7xl text-rose/40">✿</div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-xs uppercase tracking-[0.3em] text-sage">{product.category}</p>
        <h1 className="mt-3 font-display text-5xl">{product.name}</h1>
        <p className="mt-4 text-2xl text-rose-deep">{formatKes(product.price_kes)}</p>
        <p className="mt-6 max-w-md text-ink/70">{product.description}</p>
        <p className="mt-4 text-sm text-ink/50">
          {product.stock > 0 ? `${product.stock} in the atelier` : "Currently sold out"}
        </p>
        <div className="mt-8 max-w-sm">
          <AddToBag product={product} />
        </div>
      </div>
    </div>
  );
}
