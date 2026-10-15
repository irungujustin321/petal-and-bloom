export function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function normalizeKenyaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    return `254${digits}`;
  }
  return null;
}

export function statusLabel(status: string) {
  switch (status) {
    case "pending_payment":
      return "Awaiting M-Pesa";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    case "cancelled":
      return "Cancelled";
    case "fulfilled":
      return "Fulfilled";
    default:
      return status;
  }
}
