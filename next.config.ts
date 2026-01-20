import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow importing the Vuexy template files from the adjacent workspace folder
    externalDir: true,
  },
};

export default nextConfig;
