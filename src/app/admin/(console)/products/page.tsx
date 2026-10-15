import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { formatKes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select("*").order("name");
  const products = (data as Product[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-5xl">Stock & prices</h1>
        <Link href="/admin/products/new" className="rounded-full bg-rose-deep px-4 py-2 text-sm text-cream">
          New piece
        </Link>
      </div>
      <div className="mt-8 overflow-hidden rounded-3xl border border-rose/20 bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush/60 text-ink/70">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Live</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-rose/15">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="text-rose-deep hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3">{formatKes(p.price_kes)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">{p.is_active ? "Yes" : "Hidden"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
