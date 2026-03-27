# Quote That

Quote That is a mobile app for saving and sharing funny quotes with friends in private groups.

## Tech Stack
- React Native
- Expo
- TypeScript
- Supabase
- Zustand
- React Navigation

## MVP Scope
- Sign up / login
- Create group
- Join group
- Add quote
- View quotes in a group

## Run locally
1. Install dependencies
2. Create `.env`
3. Run:

```bash
npm install
npx expo start
```

## Supabase E2E Test
Run the integration script against your real Supabase project with:

```bash
npm run test:supabase:e2e
```

Required `.env` values:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_E2E_EMAIL=...
SUPABASE_E2E_PASSWORD=...
```

Optional `.env` value:

```bash
SUPABASE_E2E_GROUP_ID=...
SUPABASE_E2E_NON_MEMBER_EMAIL=...
SUPABASE_E2E_NON_MEMBER_PASSWORD=...
```

If `SUPABASE_E2E_GROUP_ID` is not set, the test suite creates a new test group, runs quote create/update/delete against it, and leaves that group in Supabase for inspection.

If `SUPABASE_E2E_NON_MEMBER_EMAIL` and `SUPABASE_E2E_NON_MEMBER_PASSWORD` are set, the suite also verifies that a signed-in user who is not a group member cannot insert quotes into that group.

The command now uses Node's built-in test runner, so it is CI-friendly and is wired into the GitHub Actions workflow at [.github/workflows/supabase-e2e.yml](.github/workflows/supabase-e2e.yml).