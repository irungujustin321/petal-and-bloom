import { NextResponse } from "next/server";
import { queryStkPush } from "@/lib/mpesa";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (order.status === "pending_payment" && order.checkout_request_id) {
    try {
      const query = await queryStkPush(order.checkout_request_id);
      if (query.ResultCode === "0") {
        const admin = createAdminClient();
        await admin
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            result_code: "0",
            result_desc: query.ResultDesc,
          })
          .eq("id", order.id)
          .eq("status", "pending_payment");
        return NextResponse.json({ status: "paid" });
      }
      if (query.ResultCode && query.ResultCode !== "1032" && query.ResultCode !== "0") {
        const stillPending = ["1037", "1", "4999", "1036"].includes(String(query.ResultCode));
        if (!stillPending && query.ResultDesc && !/processing|request/i.test(query.ResultDesc)) {
          const admin = createAdminClient();
          await admin.rpc("restore_order_stock", { p_order_id: order.id });
          await admin
            .from("orders")
            .update({
              status: "failed",
              result_code: String(query.ResultCode),
              result_desc: query.ResultDesc,
            })
            .eq("id", order.id)
            .eq("status", "pending_payment");
          return NextResponse.json({ status: "failed", message: query.ResultDesc });
        }
      }
    } catch {
      /* callback may still arrive */
    }
  }

  return NextResponse.json({
    status: order.status,
    message:
      order.status === "pending_payment"
        ? "Check your phone and enter your M-Pesa PIN."
        : undefined,
  });
}
