import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-display text-5xl">New piece</h1>
      <p className="mt-2 text-ink/60">Set the name, price in Kenyan shillings, and how many bottles you have.</p>
      <ProductForm />
    </div>
  );
}
