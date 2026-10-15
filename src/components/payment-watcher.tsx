"use client";

import { useEffect, useState } from "react";
import type { OrderStatus } from "@/lib/types";
import { statusLabel } from "@/lib/utils";

export function PaymentWatcher({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [hint, setHint] = useState("Check your phone and enter your M-Pesa PIN.");

  useEffect(() => {
    if (status !== "pending_payment") return;
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/mpesa/status?orderId=${orderId}`);
      const data = (await res.json()) as { status?: OrderStatus; message?: string };
      if (data.status && data.status !== status) {
        setStatus(data.status);
        window.location.reload();
      }
      if (data.message) setHint(data.message);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [orderId, status]);

  return (
    <div className="mt-6 rounded-3xl border border-gold/40 bg-blush/60 p-5">
      <p className="font-medium">Waiting for M-Pesa…</p>
      <p className="mt-1 text-sm text-ink/70">{hint}</p>
      <p className="mt-2 text-xs text-ink/50">{statusLabel(status)}</p>
    </div>
  );
}
