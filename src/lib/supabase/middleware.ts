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

  // Public routes — no auth required
  const publicPaths = ["/auth", "/book", "/api"];
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    publicPaths.some((path) => request.nextUrl.pathname.startsWith(path)) ||
    ["/about", "/blog", "/careers", "/checklist", "/contact", "/faq", "/locations", "/privacy-policy", "/quote", "/services", "/terms-of-service"].some(
      (path) => request.nextUrl.pathname.startsWith(path)
    );

  if (isPublicRoute) {
    if (user && request.nextUrl.pathname === "/auth/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ["/admin", "/provider", "/customer", "/cleaner"];
  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
