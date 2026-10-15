import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatKes } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group overflow-hidden rounded-3xl border border-rose/20 bg-white/70 shadow-[0_12px_40px_rgba(122,48,64,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(122,48,64,0.14)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-blush">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="grid h-full place-items-center font-display text-5xl text-rose/50">✿</div>
        )}
        {product.stock < 1 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs text-cream">
            Sold out
          </span>
        )}
      </div>
      <div className="space-y-1 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">{product.category}</p>
        <h3 className="font-display text-2xl text-ink">{product.name}</h3>
        <p className="text-rose-deep">{formatKes(product.price_kes)}</p>
      </div>
    </Link>
  );
}
