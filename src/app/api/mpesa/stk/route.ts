import { NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { normalizeKenyaPhone } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in as a customer to pay." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") {
    return NextResponse.json({ message: "Admin accounts cannot place shop orders." }, { status: 403 });
  }

  const body = (await request.json()) as {
    phone?: string;
    items?: { product_id: string; quantity: number }[];
  };
  const phone = normalizeKenyaPhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ message: "Enter a valid Kenyan mobile number." }, { status: 400 });
  }
  if (!body.items?.length) {
    return NextResponse.json({ message: "Your bag is empty." }, { status: 400 });
  }

  const { data, error } = await supabase
    .rpc("place_order", {
      p_items: body.items,
      p_phone: phone,
    })
    .single();
  const order = data as Order | null;

  if (error || !order) {
    return NextResponse.json(
      { message: error?.message || "Could not reserve stock." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  try {
    const stk = await initiateStkPush({
      phone,
      amount: order.total_kes,
      accountRef: `PB${String(order.id).replace(/-/g, "").slice(0, 10)}`,
      description: "PetalBloom",
    });

    if (!stk.CheckoutRequestID || String(stk.ResponseCode) !== "0") {
      await admin.rpc("restore_order_stock", { p_order_id: order.id });
      await admin
        .from("orders")
        .update({
          status: "failed",
          result_desc: stk.errorMessage || stk.ResponseDescription || "STK push rejected",
        })
        .eq("id", order.id);
      return NextResponse.json(
        { message: stk.errorMessage || stk.CustomerMessage || "M-Pesa did not accept the request." },
        { status: 502 },
      );
    }

    await admin
      .from("orders")
      .update({
        checkout_request_id: stk.CheckoutRequestID,
        merchant_request_id: stk.MerchantRequestID,
      })
      .eq("id", order.id);

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    await admin.rpc("restore_order_stock", { p_order_id: order.id });
    await admin
      .from("orders")
      .update({
        status: "failed",
        result_desc: err instanceof Error ? err.message : "M-Pesa error",
      })
      .eq("id", order.id);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "M-Pesa is unavailable." },
      { status: 502 },
    );
  }
}
