import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatKes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();
  const [{ count: productCount }, { count: orderCount }, { data: paid }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total_kes").eq("status", "paid"),
  ]);
  const revenue =
    paid?.reduce((sum: number, row: { total_kes: number }) => sum + row.total_kes, 0) ?? 0;

  return (
    <div>
      <h1 className="font-display text-5xl">Overview</h1>
      <p className="mt-2 text-ink/60">Stock, prices, and M-Pesa orders live here.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-rose/20 bg-white/70 p-6">
          <p className="text-sm text-ink/50">Catalog pieces</p>
          <p className="font-display text-4xl">{productCount ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-rose/20 bg-white/70 p-6">
          <p className="text-sm text-ink/50">Orders</p>
          <p className="font-display text-4xl">{orderCount ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-rose/20 bg-white/70 p-6">
          <p className="text-sm text-ink/50">Paid revenue</p>
          <p className="font-display text-4xl">{formatKes(revenue)}</p>
        </div>
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/admin/products/new" className="rounded-full bg-rose-deep px-5 py-2 text-cream">
          Add stock
        </Link>
        <Link href="/admin/orders" className="rounded-full border border-rose/30 px-5 py-2">
          Review orders
        </Link>
      </div>
    </div>
  );
}
