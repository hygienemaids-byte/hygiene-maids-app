"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestSupabase() {
  const [result, setResult] = useState<string>("Loading...");

  useEffect(() => {
    async function test() {
      try {
        const supabase = createClient();
        setResult("Client created, fetching...");
        
        const { data, error } = await supabase
          .from("pricing_matrix")
          .select("*")
          .limit(3);
        
        if (error) {
          setResult(`Error: ${error.message}`);
        } else {
          setResult(`Success! Got ${data?.length} rows. First: ${JSON.stringify(data?.[0])}`);
        }
      } catch (e: unknown) {
        setResult(`Exception: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    test();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>Supabase Browser Test</h1>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
      <hr />
      <p>{result}</p>
    </div>
  );
}
