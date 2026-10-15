export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "failed"
  | "cancelled"
  | "fulfilled";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string;
  price_kes: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_kes: number;
  phone: string;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  mpesa_receipt: string | null;
  result_code: string | null;
  result_desc: string | null;
  created_at: string;
  paid_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_kes: number;
  quantity: number;
};

export type CartItem = {
  productId: string;
  name: string;
  priceKes: number;
  quantity: number;
  imageUrl: string | null;
  stock: number;
};

export const CATEGORIES = [
  { slug: "skincare", label: "Skincare" },
  { slug: "makeup", label: "Makeup" },
  { slug: "fragrance", label: "Fragrance" },
  { slug: "hair", label: "Hair" },
  { slug: "body", label: "Body" },
] as const;
