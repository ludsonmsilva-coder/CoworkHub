# CoworkHub

CoworkHub is an Expo Router app for coworking operations, with flows for operator and member areas, Supabase auth/data, bookings, finance, leases, and workspace settings.

## Stack

- Expo 53
- Expo Router
- React Native Web
- Supabase
- NativeWind
- TanStack Query

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`.

3. Fill these variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PAID_EMAIL_OVERRIDES=admin1@company.com,admin2@company.com
```

4. Start the project:

```bash
npm run start
```

5. For web:

```bash
npm run web
```

## Production web build

```bash
npm run build:web
```

The static output is generated in `dist/`.

## Deploy on Vercel

1. Import the GitHub repository into Vercel.
2. Set these environment variables in the Vercel project:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Keep the default install command as `npm install`.
4. Use the build command:

```bash
npm run build:web
```

5. Use `dist` as the output directory.

The included `vercel.json` already configures the build output and rewrites all routes to `index.html`, which is required for Expo Router on static hosting.

## Security checklist (production)

1. Configure env vars in Vercel project settings and do not hardcode credentials in the repository.
2. Keep `EXPO_PUBLIC_SUPABASE_ANON_KEY` as publishable-only key (never service-role in client).
3. Configure `EXPO_PUBLIC_PAID_EMAIL_OVERRIDES` only with trusted operator emails.
4. For Edge reminders, set all required secrets (`REMINDER_CRON_SECRET`, `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`).
5. Keep RLS enabled in Supabase for all business tables (`spaces`, `members`, `rooms`, `bookings`, `leases`, `invoices`).

## Quality gates

```bash
npm run typecheck
npm run build:web
```

## Supabase DB hardening (phase 2)

This repository includes:

1. RLS/policy/index migration baseline:
   - `supabase/migrations/20260713_security_rls_hardening.sql`
2. Audit SQL checklist for production verification:
   - `supabase/DB_AUDIT_CHECKLIST.sql`

Run them in Supabase SQL Editor (or via migrations pipeline) and confirm all checklist queries return expected results.