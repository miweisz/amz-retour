import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/amazon-retour",
  output: "standalone",
  async redirects() {
    // So http://localhost:3007/ forwards to the app (which lives under basePath).
    return [{ source: "/", destination: "/amazon-retour", basePath: false, permanent: false }];
  },
};

export default nextConfig;
