"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    if (signError) {
      setError(signError.message);
      setLoading(false);
      return;
    }
    router.push("/shop");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-sage">Customers</p>
      <h1 className="mt-2 font-display text-5xl">Join the garden</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-rose/20 bg-white/70 p-6">
        <label className="block text-sm">
          Full name
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
          />
        </label>
        <label className="block text-sm">
          M-Pesa phone
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xx or 2547xx"
            className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
          />
        </label>
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
            minLength={6}
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
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        Already with us?{" "}
        <Link href="/login" className="text-rose-deep underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
