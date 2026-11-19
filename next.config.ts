import type { NextConfig } from "next";

/** The brief names these endpoints without the /api prefix, so both forms reach the same handler. */
export const BRIEF_PATHS = ["feed", "swipe", "matches"] as const;

const nextConfig: NextConfig = {
  // A rewrite, not a redirect: a POST keeps its method and body, and the address doesn't change.
  rewrites() {
    return BRIEF_PATHS.map((name) => ({ source: `/${name}`, destination: `/api/${name}` }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
