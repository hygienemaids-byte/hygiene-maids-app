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

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes — no auth required
  const publicPaths = ["/auth", "/book", "/api"];
  const publicPages = [
    "/about", "/blog", "/careers", "/checklist", "/contact",
    "/faq", "/locations", "/privacy-policy", "/quote", "/services", "/terms-of-service",
  ];
  const isPublicRoute =
    pathname === "/" ||
    publicPaths.some((path) => pathname.startsWith(path)) ||
    publicPages.some((path) => pathname.startsWith(path));

  if (isPublicRoute) {
    // If logged-in user visits the customer/cleaner login page, redirect to their dashboard
    if (user && pathname === "/auth/login") {
      const role = user.user_metadata?.role;
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
      const role = user.user_metadata?.role;
      if (role === "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  }

  // Protected routes — redirect to appropriate login if not authenticated
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

  // Role-based access control for authenticated users
  const role = user.user_metadata?.role;

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
