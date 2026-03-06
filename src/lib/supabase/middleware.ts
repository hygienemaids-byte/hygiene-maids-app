import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - IMPORTANT: must call getUser() to refresh tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ============================================================
  // PUBLIC ROUTES — no auth required
  // ============================================================
  const publicPrefixes = ["/auth", "/book", "/api"];
  const publicPages = [
    "/about", "/blog", "/careers", "/checklist", "/contact",
    "/faq", "/locations", "/privacy-policy", "/quote", "/services", "/terms-of-service",
  ];
  const isPublicRoute =
    pathname === "/" ||
    publicPrefixes.some((path) => pathname.startsWith(path)) ||
    publicPages.some((path) => pathname.startsWith(path));

  if (isPublicRoute) {
    // If logged-in user visits the customer/cleaner login page, redirect to their dashboard
    if (user && pathname === "/auth/login") {
      const role = await getUserRole(user, supabase);
      const url = request.nextUrl.clone();
      if (role === "admin") {
        url.pathname = "/admin";
      } else if (role === "provider" || role === "cleaner") {
        url.pathname = "/cleaner/dashboard";
      } else {
        url.pathname = "/customer/dashboard";
      }
      return NextResponse.redirect(url);
    }

    // If logged-in admin visits admin login page, redirect to admin dashboard
    if (user && pathname === "/auth/admin") {
      const role = await getUserRole(user, supabase);
      if (role === "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  }

  // ============================================================
  // PROTECTED ROUTES — require authentication
  // ============================================================
  const isAdminRoute = pathname.startsWith("/admin");
  const isCleanerRoute = pathname.startsWith("/cleaner") || pathname.startsWith("/provider");
  const isCustomerRoute = pathname.startsWith("/customer");

  if (!user) {
    const url = request.nextUrl.clone();
    if (isAdminRoute) {
      url.pathname = "/auth/admin";
    } else {
      url.pathname = "/auth/login";
    }
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ============================================================
  // ROLE-BASED ACCESS CONTROL
  // ============================================================
  const role = await getUserRole(user, supabase);

  // Admin routes: only admin role
  if (isAdminRoute && role !== "admin") {
    const url = request.nextUrl.clone();
    if (role === "provider" || role === "cleaner") {
      url.pathname = "/cleaner/dashboard";
    } else {
      url.pathname = "/customer/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Cleaner routes: only provider/cleaner role (and admin)
  if (isCleanerRoute && role !== "provider" && role !== "cleaner" && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/customer/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

/**
 * Get user role with fallback chain:
 * 1. Check user_metadata.role (fast, set during signup or synced by /api/auth/role)
 * 2. If not available, query profiles table directly
 * 3. Default to "customer" if nothing found
 */
async function getUserRole(user: any, supabase: any): Promise<string> {
  // First try user_metadata (fastest — no extra DB query)
  const metaRole = user.user_metadata?.role;
  if (metaRole) return metaRole;

  // Fallback: query profiles table
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) return profile.role;
  } catch {
    // If profiles query fails (e.g., RLS issue), fall through to default
  }

  return "customer";
}
