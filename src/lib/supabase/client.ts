import { createClient as supabaseCreateClient, SupabaseClient } from "@supabase/supabase-js";

// Using 'any' for database types since we don't have generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, "public", any> | null = null;

export function createClient() {
  if (_client) return _client;
  
  _client = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return _client;
}
