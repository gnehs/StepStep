/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  // Never copy local credential files into the production server trace.
  outputFileTracingExcludes: {
    "/*": [".env", ".env.*", "**/.env", "**/.env.*"],
  },
};

export default nextConfig;
