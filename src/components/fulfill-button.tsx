"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FulfillButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-full bg-sage px-3 py-1 text-xs text-white"
      onClick={async () => {
        const supabase = createClient();
        await supabase.from("orders").update({ status: "fulfilled" }).eq("id", orderId);
        router.refresh();
      }}
    >
      Mark fulfilled
    </button>
  );
}
