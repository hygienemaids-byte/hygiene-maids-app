// @ts-nocheck
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Service role client to bypass RLS for profile lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Look up role from profiles table (source of truth)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // No profile found — fall back to user_metadata role
      const metadataRole = user.user_metadata?.role || "customer";
      return NextResponse.json({
        role: metadataRole,
        source: "metadata",
        userId: user.id,
      });
    }

    // If profile role differs from user_metadata, sync user_metadata
    if (profile.role !== user.user_metadata?.role) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          role: profile.role,
          first_name: profile.first_name || user.user_metadata?.first_name,
          last_name: profile.last_name || user.user_metadata?.last_name,
        },
      });
    }

    return NextResponse.json({
      role: profile.role,
      source: "profiles",
      userId: user.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
    });
  } catch (err) {
    console.error("Role lookup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
