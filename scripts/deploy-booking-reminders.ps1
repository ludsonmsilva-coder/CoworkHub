param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  throw "SUPABASE_ACCESS_TOKEN nao definido no ambiente."
}

if (-not $env:RESEND_API_KEY) {
  throw "RESEND_API_KEY nao definido no ambiente."
}

if (-not $env:REMINDER_CRON_SECRET) {
  throw "REMINDER_CRON_SECRET nao definido no ambiente."
}

if (-not $env:REMINDER_FROM_EMAIL) {
  $env:REMINDER_FROM_EMAIL = "lembretes@lokaro.co"
}

Write-Host "[1/4] Linkando projeto $ProjectRef..." -ForegroundColor Cyan
npx --yes supabase@latest link --project-ref $ProjectRef

Write-Host "[2/4] Aplicando migracoes..." -ForegroundColor Cyan
npx --yes supabase@latest db push

Write-Host "[3/4] Configurando secrets..." -ForegroundColor Cyan
npx --yes supabase@latest secrets set `
  RESEND_API_KEY=$env:RESEND_API_KEY `
  REMINDER_FROM_EMAIL=$env:REMINDER_FROM_EMAIL `
  REMINDER_CRON_SECRET=$env:REMINDER_CRON_SECRET `
  REMINDER_WINDOW_MINUTES=5

Write-Host "[4/4] Deploy da função..." -ForegroundColor Cyan
npx --yes supabase@latest functions deploy send-booking-reminders --no-verify-jwt

Write-Host "Concluido. Agora agende chamadas POST para a funcao a cada 5 minutos." -ForegroundColor Green
