# send-booking-reminders

Edge Function que envia lembretes de reservas pelo Resend.

## O que ela faz
- Busca reservas confirmadas com `reminder_hours` definido.
- Seleciona reservas cujo horário do lembrete está entre `agora` e `agora + janela`.
- Envia email via Resend.
- Marca `reminder_sent_at` para evitar envio duplicado.

## Secrets obrigatórios
- `RESEND_API_KEY`
- `REMINDER_FROM_EMAIL` (ex.: lembretes@lokaro.co)
- `REMINDER_CRON_SECRET` (string forte)

A função também usa automaticamente:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Secrets opcionais
- `REMINDER_WINDOW_MINUTES` (default: 5)

## Deploy
```bash
supabase functions deploy send-booking-reminders --no-verify-jwt
```

## Script pronto no projeto
Você pode rodar todo o setup com o script:

```powershell
.\scripts\deploy-booking-reminders.ps1 -ProjectRef <PROJECT_REF>
```

Antes, defina no terminal as variáveis de ambiente:

```powershell
$env:SUPABASE_ACCESS_TOKEN="..."
$env:RESEND_API_KEY="..."
$env:REMINDER_CRON_SECRET="..."
$env:REMINDER_FROM_EMAIL="lembretes@lokaro.co"
```

## Teste manual
```bash
curl -X POST "https://<PROJECT_REF>.functions.supabase.co/send-booking-reminders" \
  -H "Authorization: Bearer <REMINDER_CRON_SECRET>" \
  -H "Content-Type: application/json"
```

## Agendamento recomendado
- Frequência: a cada 5 minutos.
- Alvo: endpoint da função.
- Header: `Authorization: Bearer <REMINDER_CRON_SECRET>`.
