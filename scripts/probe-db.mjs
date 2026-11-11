import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data, error } = await s.from("orders").select("id,status").limit(3);
console.log("orders", JSON.stringify({ data, error }, null, 2));

const { data: products, error: pErr } = await s.from("products").select("id,name").limit(3);
console.log("products", JSON.stringify({ products, pErr }, null, 2));
