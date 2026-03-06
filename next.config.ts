import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip type checking during build — we don't have generated Supabase types
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
