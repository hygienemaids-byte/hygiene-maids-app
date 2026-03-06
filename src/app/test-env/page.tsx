"use client";
export default function TestEnv() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Env Test</h1>
      <pre>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET"}</pre>
      <pre>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "NOT SET"}</pre>
    </div>
  );
}
