// @ts-nocheck
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "";

  if (code) {
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
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If a specific next path was provided (e.g., /auth/reset-password), use it
      if (next) {
        return redirectTo(request, next);
      }

      // Otherwise, determine redirect based on user role
      const { data: { user } } = await supabase.auth.getUser();

      let redirectPath = "/customer/dashboard";

      if (user) {
        // Try to get role from profiles table first (source of truth)
        let role = user.user_metadata?.role;

        try {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile?.role) {
            role = profile.role;

            // Sync user_metadata if different
            if (role !== user.user_metadata?.role) {
              await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { ...user.user_metadata, role },
              });
            }
          }
        } catch {
          // Fall back to user_metadata role
        }

        if (role === "admin") redirectPath = "/admin";
        else if (role === "provider" || role === "cleaner") redirectPath = "/cleaner/dashboard";
        else redirectPath = "/customer/dashboard";
      }

      return redirectTo(request, redirectPath);
    }
  }

  // If code exchange fails, redirect to login with error
  return redirectTo(request, "/auth/login?error=auth_callback_error");
}

function redirectTo(request: NextRequest, path: string) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${path}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  } else {
    return NextResponse.redirect(`${origin}${path}`);
  }
}
