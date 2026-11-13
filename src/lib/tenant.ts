import { createClient } from "./supabase/server";
export async function getCurrentTenantId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  return (data as { tenant_id: string } | null)?.tenant_id ?? null;
}
