import { NextResponse } from "next/server";
import { receiptFromCallback, type StkCallbackBody } from "@/lib/mpesa";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json()) as StkCallbackBody;
  const callback = body.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("checkout_request_id", callback.CheckoutRequestID)
    .maybeSingle();

  if (order && order.status === "pending_payment") {
    if (callback.ResultCode === 0) {
      await admin
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          mpesa_receipt: receiptFromCallback(body),
          result_code: String(callback.ResultCode),
          result_desc: callback.ResultDesc,
        })
        .eq("id", order.id)
        .eq("status", "pending_payment");
    } else {
      const { data: failed } = await admin
        .from("orders")
        .update({
          status: "failed",
          result_code: String(callback.ResultCode),
          result_desc: callback.ResultDesc,
        })
        .eq("id", order.id)
        .eq("status", "pending_payment")
        .select("id");
      if (failed?.length) {
        await admin.rpc("restore_order_stock", { p_order_id: order.id });
      }
    }
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
