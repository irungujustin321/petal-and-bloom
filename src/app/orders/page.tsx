import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import type { Order } from "@/lib/types";
import { formatKes, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { user, supabase, error } = await requireCustomer();
  if (!user) redirect("/login");
  if (error) redirect("/admin");

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (data as Order[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">Your orders</h1>
      {orders.length === 0 ? (
        <p className="mt-8 text-ink/60">No petals purchased yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-3xl border border-rose/20 bg-white/70 p-5"
            >
              <div>
                <p className="font-display text-2xl">{formatKes(order.total_kes)}</p>
                <p className="text-sm text-ink/50">
                  {new Date(order.created_at).toLocaleString("en-KE")}
                </p>
              </div>
              <span className="rounded-full bg-blush px-3 py-1 text-sm text-rose-deep">
                {statusLabel(order.status)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
