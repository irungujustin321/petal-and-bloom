import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.0";

type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item?: { Name: string; Value?: string | number }[];
      };
    };
  };
};

function receiptFromCallback(body: StkCallbackBody) {
  const items = body.Body?.stkCallback?.CallbackMetadata?.Item ?? [];
  const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
  return receipt != null ? String(receipt) : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Prefer PETAL_* so this function can update the Petal DB even when hosted on another project.
  const url =
    Deno.env.get("PETAL_SUPABASE_URL") ??
    Deno.env.get("SUPABASE_URL") ??
    Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    Deno.env.get("PETAL_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: StkCallbackBody;
  try {
    body = (await req.json()) as StkCallbackBody;
  } catch {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const callback = body.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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

  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });
});
