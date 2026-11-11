import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const checkoutId = `verify_${Date.now()}`;
const { data: order, error } = await admin
  .from("orders")
  .select("id,status")
  .eq("status", "failed")
  .limit(1)
  .maybeSingle();

if (error || !order) {
  console.error("No order to reuse for verify", error);
  process.exit(1);
}

await admin
  .from("orders")
  .update({
    status: "pending_payment",
    checkout_request_id: checkoutId,
    result_desc: null,
    result_code: null,
    mpesa_receipt: null,
    paid_at: null,
  })
  .eq("id", order.id);

const callbackUrl = process.env.MPESA_CALLBACK_URL;
const body = {
  Body: {
    stkCallback: {
      MerchantRequestID: "verify-merchant",
      CheckoutRequestID: checkoutId,
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      CallbackMetadata: {
        Item: [
          { Name: "Amount", Value: 1 },
          { Name: "MpesaReceiptNumber", Value: "VERIFY123" },
          { Name: "PhoneNumber", Value: 254708374149 },
        ],
      },
    },
  },
};

const res = await fetch(callbackUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
console.log("callback_status", res.status, await res.text());

await new Promise((r) => setTimeout(r, 1500));
const { data: updated } = await admin
  .from("orders")
  .select("id,status,mpesa_receipt,result_desc")
  .eq("id", order.id)
  .single();
console.log("order_after", updated);

if (updated?.status !== "paid" || updated?.mpesa_receipt !== "VERIFY123") {
  process.exit(1);
}
console.log("edge_callback_ok");
