"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FloralCorner } from "@/components/floral-frame";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    if (signError) {
      setError(signError.message);
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setError("This login is reserved for atelier staff.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <FloralCorner className="absolute left-4 top-4 h-32 w-32" />
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-sage">Staff only</p>
        <h1 className="mt-2 font-display text-5xl">Atelier console</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-rose/20 bg-white/80 p-6">
          <label className="block text-sm">
            Admin email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
            />
          </label>
          {error && <p className="text-sm text-rose-deep">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink py-3 text-cream disabled:opacity-60"
          >
            {loading ? "Checking…" : "Enter console"}
          </button>
        </form>
        <p className="mt-6 text-sm text-ink/50">
          Shoppers use{" "}
          <Link href="/login" className="underline">
            the customer door
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
