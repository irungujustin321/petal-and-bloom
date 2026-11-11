# Run after: npx vercel login
# Deploys petal-and-bloom to Vercel production with M-Pesa + Supabase env from .env.local

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

function Get-EnvValue([string]$name) {
  $line = Get-Content .env.local | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
  if (-not $line) { throw "Missing $name in .env.local" }
  return ($line -split "=", 2)[1]
}

$envArgs = @(
  "--env", "NEXT_PUBLIC_SUPABASE_URL=$(Get-EnvValue 'NEXT_PUBLIC_SUPABASE_URL')",
  "--env", "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(Get-EnvValue 'NEXT_PUBLIC_SUPABASE_ANON_KEY')",
  "--env", "SUPABASE_SERVICE_ROLE_KEY=$(Get-EnvValue 'SUPABASE_SERVICE_ROLE_KEY')",
  "--env", "MPESA_ENV=$(Get-EnvValue 'MPESA_ENV')",
  "--env", "MPESA_CONSUMER_KEY=$(Get-EnvValue 'MPESA_CONSUMER_KEY')",
  "--env", "MPESA_CONSUMER_SECRET=$(Get-EnvValue 'MPESA_CONSUMER_SECRET')",
  "--env", "MPESA_SHORTCODE=$(Get-EnvValue 'MPESA_SHORTCODE')",
  "--env", "MPESA_PASSKEY=$(Get-EnvValue 'MPESA_PASSKEY')",
  "--env", "MPESA_CALLBACK_URL=$(Get-EnvValue 'MPESA_CALLBACK_URL')",
  "--env", "MPESA_TRANSACTION_TYPE=$(Get-EnvValue 'MPESA_TRANSACTION_TYPE')"
)

npx vercel --prod --yes @envArgs
