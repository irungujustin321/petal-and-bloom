import { redirect } from "next/navigation";
import { PaymentWatcher } from "@/components/payment-watcher";
import { requireCustomer } from "@/lib/auth";
import type { Order, OrderItem } from "@/lib/types";
import { formatKes, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, supabase, error } = await requireCustomer();
  if (!user) redirect("/login");
  if (error) redirect("/admin");

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order) redirect("/orders");

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);

  const typed = order as Order;
  const lines = (items as OrderItem[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-sage">Order</p>
      <h1 className="mt-2 font-display text-5xl">{formatKes(typed.total_kes)}</h1>
      <p className="mt-2 text-ink/60">{statusLabel(typed.status)}</p>
      {typed.status === "pending_payment" && (
        <PaymentWatcher orderId={typed.id} initialStatus={typed.status} />
      )}
      {typed.mpesa_receipt && (
        <p className="mt-4 text-sm">M-Pesa receipt: {typed.mpesa_receipt}</p>
      )}
      <ul className="mt-8 space-y-3">
        {lines.map((line) => (
          <li key={line.id} className="flex justify-between rounded-2xl bg-white/70 px-4 py-3">
            <span>
              {line.product_name} × {line.quantity}
            </span>
            <span>{formatKes(line.unit_price_kes * line.quantity)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
