/**
 * Auth helpers for role verification
 * Fetches the user's role from the profiles table via API
 * This is the source of truth for role-based access control
 */

export type UserRole = "admin" | "provider" | "cleaner" | "customer";

export interface RoleResponse {
  role: UserRole;
  source: "profiles" | "metadata";
  userId: string;
  firstName?: string;
  lastName?: string;
  error?: string;
}

/**
 * Fetch the authenticated user's role from the server-side profiles table.
 * This bypasses user_metadata and checks the actual database.
 * Also syncs user_metadata if it's out of date.
 */
export async function fetchUserRole(): Promise<RoleResponse> {
  const res = await fetch("/api/auth/role", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch user role");
  }

  return res.json();
}

/**
 * Determine the correct dashboard path for a given role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "provider":
    case "cleaner":
      return "/cleaner/dashboard";
    case "customer":
    default:
      return "/customer/dashboard";
  }
}
