import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminSignOut } from "@/components/admin-sign-out";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authorized, profile } = await requireAdmin();
  if (!authorized) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-cream">
      <aside className="border-b border-rose/20 bg-ink text-cream md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r md:border-rose/10">
        <div className="px-6 py-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Petal & Bloom</p>
          <p className="font-display text-3xl">Atelier</p>
          <p className="mt-2 truncate text-xs text-cream/60">{profile?.email}</p>
        </div>
        <nav className="flex gap-4 px-6 pb-6 text-sm md:flex-col">
          <Link href="/admin" className="hover:text-gold">
            Overview
          </Link>
          <Link href="/admin/products" className="hover:text-gold">
            Stock & prices
          </Link>
          <Link href="/admin/orders" className="hover:text-gold">
            Orders
          </Link>
          <Link href="/shop" className="hover:text-gold">
            View shop
          </Link>
          <AdminSignOut />
        </nav>
      </aside>
      <div className="md:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
      </div>
    </div>
  );
}
