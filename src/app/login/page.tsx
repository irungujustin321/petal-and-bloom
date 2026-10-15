"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
    if (profile?.role === "admin") {
      await supabase.auth.signOut();
      setError("Staff accounts use the admin console.");
      setLoading(false);
      return;
    }
    router.push("/shop");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-sage">Customers</p>
      <h1 className="mt-2 font-display text-5xl">Welcome back</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-rose/20 bg-white/70 p-6">
        <label className="block text-sm">
          Email
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
          className="w-full rounded-full bg-rose-deep py-3 text-cream disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        New here?{" "}
        <Link href="/register" className="text-rose-deep underline">
          Create a customer account
        </Link>
      </p>
      <p className="mt-2 text-sm text-ink/50">
        Staff?{" "}
        <Link href="/admin/login" className="underline">
          Admin console
        </Link>
      </p>
    </div>
  );
}
