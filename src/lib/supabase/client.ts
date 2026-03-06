import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof supabaseCreateClient> | null = null;

export function createClient() {
  if (_client) return _client;
  
  _client = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return _client;
}
