import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function createClient() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
    { cookies: { getAll: () => store.getAll(), setAll: (all: { name: string; value: string; options: Record<string, unknown> }[]) => { all.forEach(({ name, value, options }) => { try { store.set(name, value, options as never); } catch { /* setAll may fail in Server Components; middleware refreshes the session */ } }); } } }
  );
}
