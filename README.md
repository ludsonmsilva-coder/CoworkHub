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