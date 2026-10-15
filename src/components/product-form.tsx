"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, type Product } from "@/lib/types";
import { slugify } from "@/lib/utils";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "skincare");
  const [price, setPrice] = useState(product?.price_kes?.toString() ?? "");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onFile(file: File) {
    const supabase = createClient();
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
      upsert: true,
    });
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      name,
      slug: slugify(name),
      description,
      category,
      price_kes: Number(price),
      stock: Number(stock),
      image_url: imageUrl || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };
    const query = product
      ? supabase.from("products").update(payload).eq("id", product.id)
      : supabase.from("products").insert(payload);
    const { error: saveError } = await query;
    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-4 rounded-3xl border border-rose/20 bg-white/70 p-6">
      <label className="block text-sm">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
        />
      </label>
      <label className="block text-sm">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
        />
      </label>
      <label className="block text-sm">
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          Price (KES)
          <input
            required
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
          />
        </label>
        <label className="block text-sm">
          Stock
          <input
            required
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        Image URL
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-rose/30 bg-cream px-4 py-2"
        />
      </label>
      <label className="block text-sm">
        Or upload
        <input
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Visible in the shop
      </label>
      {error && <p className="text-sm text-rose-deep">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-rose-deep px-6 py-2 text-cream disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save piece"}
      </button>
    </form>
  );
}
