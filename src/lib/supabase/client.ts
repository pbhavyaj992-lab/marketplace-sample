// Browser Supabase client. Falls back to placeholder values at build
// time so `next build` does not crash before env vars are configured.
// At runtime the real NEXT_PUBLIC_SUPABASE_* values from .env.local apply.
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
  );
}
