import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-display text-6xl">404</p>
      <p className="mt-3 text-ink/60">This petal drifted off the path.</p>
      <Link href="/shop" className="mt-8 inline-block rounded-full bg-rose-deep px-6 py-2 text-cream">
        Return to the shop
      </Link>
    </div>
  );
}
