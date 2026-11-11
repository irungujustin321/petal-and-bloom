/**
 * Deploy Petal stk-callback edge function.
 * Requires SUPABASE_ACCESS_TOKEN for the account that owns project oqecxdqxmubylbxivtbp.
 *
 * Create a token: https://supabase.com/dashboard/account/tokens
 * Then: $env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/deploy-stk-callback.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const PROJECT_REF = "oqecxdqxmubylbxivtbp";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
}

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error("Set SUPABASE_ACCESS_TOKEN first (Dashboard → Account → Access Tokens).");
  process.exit(1);
}

function run(cmd, args) {
  console.log(">", cmd, args.join(" "));
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: process.env });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

run("npx", [
  "supabase",
  "secrets",
  "set",
  `SUPABASE_URL=https://${PROJECT_REF}.supabase.co`,
  `SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  `--project-ref`,
  PROJECT_REF,
  "--yes",
]);

run("npx", [
  "supabase",
  "functions",
  "deploy",
  "stk-callback",
  "--project-ref",
  PROJECT_REF,
  "--no-verify-jwt",
  "--yes",
]);

console.log(
  "Deployed:",
  `https://${PROJECT_REF}.supabase.co/functions/v1/stk-callback`,
);
