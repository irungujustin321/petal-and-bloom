import { FulfillButton } from "@/components/fulfill-button";
import { requireAdmin } from "@/lib/auth";
import type { Order } from "@/lib/types";
import { formatKes, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = (data as Order[]) ?? [];

  return (
    <div>
      <h1 className="font-display text-5xl">Orders</h1>
      <div className="mt-8 overflow-hidden rounded-3xl border border-rose/20 bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush/60 text-ink/70">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-rose/15">
                <td className="px-4 py-3">{new Date(o.created_at).toLocaleString("en-KE")}</td>
                <td className="px-4 py-3">{o.phone}</td>
                <td className="px-4 py-3">{formatKes(o.total_kes)}</td>
                <td className="px-4 py-3">{statusLabel(o.status)}</td>
                <td className="px-4 py-3">{o.mpesa_receipt ?? "—"}</td>
                <td className="px-4 py-3">
                  {o.status === "paid" && <FulfillButton orderId={o.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
